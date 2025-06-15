import uuid
import pandas as pd
import csv
import glob
import os
import re
import logging
import psycopg2
# FIX 1: Import the pool module correctly
from psycopg2 import pool
import shutil
import sys
from datetime import datetime
sys.stdout.reconfigure(encoding='utf-8')

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
connection_pool = None

def init_db_pool():
    global connection_pool
    db_params = get_db_params()
    # FIX 1: Use SimpleConnectionPool correctly
    connection_pool = pool.SimpleConnectionPool(
        1, 20, **db_params
    )
    logging.info("Database connection pool initialized")

def get_db_connection():
    global connection_pool
    if not connection_pool:
        init_db_pool()
    return connection_pool.getconn()

def return_db_connection(conn):
    global connection_pool
    connection_pool.putconn(conn)

def get_db_params():
    """Get database parameters based on environment configuration"""
    # Check if we should use local database
    if os.getenv("USE_LOCAL_DB", "true").lower() == "true":
        logging.info("Using LOCAL database configuration")
        return {
            "host": "localhost",
            "port": "5432",
            "dbname": "findatbas-copy",
            "user": "postgres",
            "password": "postgres",
        }
    
    # SUPABASE configuration (kept as fallback)
    logging.info("Using SUPABASE database configuration")
    password = os.getenv("SUPABASE_PASSWORD")
    if not password:
        raise ValueError("SUPABASE_PASSWORD environment variable is not set")
    
    return {
        "host": "aws-0-eu-central-1.pooler.supabase.com",
        "port": "6543",
        "dbname": "postgres",
        "user": "postgres.srrdkqjfynsdoqlxsohi",
        "password": password,
    }

# GitHub Codespace folder paths
PROJECT_ROOT = os.getcwd()
FOLDER_PATH = os.path.join(PROJECT_ROOT, "scripts/input/")
PROCESSED_FOLDER = os.path.join(PROJECT_ROOT, "scripts/processed/")
ERROR_FOLDER = os.path.join(PROJECT_ROOT, "scripts/errors/")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "scripts/data/parking_output.csv")

# Create folders if they don't exist
os.makedirs(FOLDER_PATH, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)
os.makedirs(ERROR_FOLDER, exist_ok=True)
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)


def extract_service_code(service_name):
    """Extract first four digits from serviceName - matches exact 4-digit codes"""
    if not service_name:
        return None
    
    pattern = r'(?<!\d)(\d{4})(?!\d)'
    match = re.search(pattern, str(service_name))
    
    if match:
        extracted_code = match.group(1)
        logging.debug(f"Extracted service code '{extracted_code}' from '{service_name}'")
        return extracted_code
    else:
        logging.warning(f"No valid 4-digit code found in: {service_name}")
        return None

def test_database_connection():
    """Test connection to Supabase database"""
    try:
        logging.info("Testing database connection...")
        db_params = get_db_params()
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()
        cur.execute("SELECT version();")
        version = cur.fetchone()
        logging.info(f"Connected to: {version[0]}")
        cur.close()
        conn.close()
        return True
    except ValueError as e:
        logging.error(f"Configuration error: {e}")
        return False
    except Exception as e:
        logging.error(f"Database connection failed: {e}")
        return False

def get_current_user():
    """Get user ID from command line arguments or system"""
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
        logging.info(f"Using authenticated user ID: {user_id}")
        return user_id
    
    logging.warning("No user ID provided, falling back to system user")
    return get_or_create_system_user()

def get_or_create_system_user():
    """Get or create system user for logging purposes"""
    try:
        db_params = get_db_params()
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()
        
        cur.execute('SELECT "id" FROM "User" WHERE "email" = %s', ('system@internal.app',))
        result = cur.fetchone()
        
        if result:
            user_id = result[0]
            logging.debug(f"Found existing system user: {user_id}")
            cur.close()
            conn.close()
            return user_id
        
        cur.execute('''
            INSERT INTO "User" ("id", "name", "email", "role", "isActive", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), 'System User', 'system@internal.app', 'ADMIN', true, %s, %s)
            RETURNING "id"
        ''', (datetime.now(), datetime.now()))
        
        user_id = cur.fetchone()[0]
        conn.commit()
        logging.info(f"Created system user: {user_id}")
        cur.close()
        conn.close()
        return user_id
        
    except Exception as e:
        logging.error(f"Error getting/creating system user: {e}")
        return None

def log_to_database(conn, entity_type, entity_id, action, subject, description=None, severity='INFO', user_id=None):
    """Log actions to the ActivityLog table"""
    try:
        cur = conn.cursor()
        
        if not user_id:
            user_id = get_current_user()
            if not user_id:
                logging.error("Cannot create log entry without valid user ID")
                return
        
        details = f"{subject}"
        if description:
            details += f": {description}"
        
        log_id = str(uuid.uuid4())
        
        log_sql = """
        INSERT INTO "ActivityLog" (
            "id", "action", "entityType", "entityId", "details", 
            "severity", "userId", "createdAt"
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        now = datetime.now()
        cur.execute(log_sql, (
            log_id,
            action,
            entity_type,
            entity_id,
            details,
            severity,
            user_id,
            now
        ))
        
        conn.commit()
        logging.info(f"ActivityLog created: {log_id} - {action} - {entity_type}")
        return log_id
        
    except Exception as e:
        logging.error(f"Failed to create ActivityLog: {e}")
        try:
            conn.rollback()
        except:
            pass
        return None

def get_or_create_service(conn, service_code, service_type='PARKING', billing_type='PREPAID'):
    """Find or create Service based on extracted 4-digit code"""
    try:
        cur = conn.cursor()
        created = False
        
        cur.execute('SELECT "id" FROM "Service" WHERE "name" = %s', (service_code,))
        result = cur.fetchone()
        
        if result:
            service_id = result[0]
            logging.info(f"Found existing service: {service_code} (ID: {service_id})")
            cur.close()
            return service_id, created
        
        created = True
        cur.execute('''
            INSERT INTO "Service" ("id", "name", "type", "billingType", "description", "isActive", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), %s, %s, %s, %s, true, %s, %s)
            RETURNING "id"
        ''', (service_code, service_type, billing_type, f'Auto-created parking service: {service_code}', datetime.now(), datetime.now()))
        
        service_id = cur.fetchone()[0]
        conn.commit()
        logging.info(f"Created new service: {service_code} (ID: {service_id})")
        cur.close()
        
        return service_id, created
        
    except Exception as e:
        logging.error(f"Error getting/creating service {service_code}: {e}")
        try:
            conn.rollback()
        except:
            pass
        return None, False

def get_or_create_parking_service(conn, provider_name):
    """Find or create ParkingService based on provider name"""
    try:
        cur = conn.cursor()
        created = False
        
        cur.execute('SELECT "id" FROM "ParkingService" WHERE "name" = %s', (provider_name,))
        result = cur.fetchone()
        
        if result:
            parking_service_id = result[0]
            logging.info(f"Found existing parking service: {provider_name} (ID: {parking_service_id})")
            cur.close()
            return parking_service_id, created
        
        created = True
        cur.execute('''
            INSERT INTO "ParkingService" ("id", "name", "isActive", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), %s, true, %s, %s)
            RETURNING "id"
        ''', (provider_name, datetime.now(), datetime.now()))
        
        parking_service_id = cur.fetchone()[0]
        conn.commit()
        logging.info(f"Created new parking service: {provider_name} (ID: {parking_service_id})")
        cur.close()
        
        return parking_service_id, created
        
    except Exception as e:
        logging.error(f"Error getting/creating parking service {provider_name}: {e}")
        try:
            conn.rollback()
        except:
            pass
        return None, False

def get_or_create_service_contract(conn, service_id, parking_service_id):
    """Create connection between Service and ParkingService"""
    try:
        cur = conn.cursor()
        created = False
        
        current_user_id = get_current_user()
        if not current_user_id:
            logging.error("Cannot create contract without current user")
            return None, created
        
        cur.execute('''
            SELECT "id" FROM "Contract" 
            WHERE "parkingServiceId" = %s AND "type" = 'PARKING' AND "status" = 'ACTIVE'
        ''', (parking_service_id,))
        
        result = cur.fetchone()
        if result:
            contract_id = result[0]
            logging.info(f"Found existing contract for parking service: {contract_id}")
            
            cur.execute('''
                SELECT "id" FROM "ServiceContract" 
                WHERE "contractId" = %s AND "serviceId" = %s
            ''', (contract_id, service_id))
            
            service_contract_result = cur.fetchone()
            if service_contract_result:
                service_contract_id = service_contract_result[0]
                logging.info(f"ServiceContract already exists: {service_contract_id}")
                cur.close()
                return service_contract_id, created
            
            created = True
            cur.execute('''
                INSERT INTO "ServiceContract" ("id", "contractId", "serviceId", "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), %s, %s, %s, %s)
                RETURNING "id"
            ''', (contract_id, service_id, datetime.now(), datetime.now()))
            
            service_contract_id = cur.fetchone()[0]
            conn.commit()
            logging.info(f"Created ServiceContract: {service_contract_id}")
            cur.close()
            return service_contract_id, created
        
        created = True
        cur.execute('''
            INSERT INTO "Contract" (
                "id", "name", "contractNumber", "type", "status", "startDate", "endDate", 
                "revenuePercentage", "parkingServiceId", "createdAt", "updatedAt", "createdById"
            )
            VALUES (gen_random_uuid(), %s, %s, 'PARKING', 'ACTIVE', %s, %s, %s, %s, %s, %s, %s)
            RETURNING "id"
        ''', (
            f'Auto-generated contract for parking service',
            f'AUTO-PARKING-{parking_service_id[:8]}-{datetime.now().strftime("%Y%m%d")}',
            datetime.now(),
            datetime.now().replace(year=datetime.now().year + 1),
            10.0,
            parking_service_id,
            datetime.now(),
            datetime.now(),
            current_user_id
        ))
        
        contract_id = cur.fetchone()[0]
        
        cur.execute('''
            INSERT INTO "ServiceContract" ("id", "contractId", "serviceId", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), %s, %s, %s, %s)
            RETURNING "id"
        ''', (contract_id, service_id, datetime.now(), datetime.now()))
        
        service_contract_id = cur.fetchone()[0]
        conn.commit()
        
        logging.info(f"Created new contract: {contract_id} and ServiceContract: {service_contract_id}")
        cur.close()
        
        return service_contract_id, created
        
    except Exception as e:
        logging.error(f"Error creating service contract: {e}")
        try:
            conn.rollback()
        except:
            pass
        return None, False

def convert_to_float(val):
    """Convert value to float"""
    if isinstance(val, str):
        val = val.replace(",", "").strip()
        try:
            return float(val)
        except ValueError:
            return None
    try:
        return float(val)
    except:
        return None

def extract_parking_provider(filename):
    """Extract provider name from filename"""
    try:
        patterns = [
            r"_mParking_(.+?)_\d+__\d+_",
            r"Servis__MicropaymentMerchantReport_(.+?)__\d+_",
            r"Parking_(.+?)_\d{8}"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, filename)
            if match:
                provider = match.group(1)
                provider = provider.replace("_", " ").title()
                provider = re.sub(r'\d{4,}', '', provider).strip()
                return provider
        
        return f"Unknown_{os.path.basename(filename)[:10]}"
    
    except Exception as e:
        return "Unknown"

def clean_date(date_val):
    """Clean date values"""
    if isinstance(date_val, str):
        date_val = date_val.strip()
        date_val = re.sub(r'\s+', ' ', date_val)
        date_val = date_val.replace(" ", "")
        date_val = date_val.rstrip('.')
    return date_val

def convert_date_format(date_str):
    """Convert date to YYYY-MM-DD format"""
    if not date_str:
        return None
    
    try:
        cleaned_date = ''.join(c for c in str(date_str) if c.isdigit() or c == '.')
        
        if cleaned_date.count('.') == 2:
            parts = cleaned_date.split('.')
            if len(parts) == 3:
                day, month, year = parts
                if len(year) == 2:
                    year = f'20{year}'
                return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        
        return None
        
    except Exception as e:
        return None

def extract_year_from_filename(filename):
    """Extract year from filename"""
    try:
        # Try to find 4-digit year in filename
        year_match = re.search(r'(\d{4})', filename)
        if year_match:
            year = int(year_match.group(1))
            # Validate that it's a reasonable year (between 2000 and current year + 1)
            current_year = datetime.now().year
            if 2000 <= year <= current_year + 1:
                return str(year)
        
        # If no year found, use current year
        return str(datetime.now().year)
    except Exception as e:
        logging.warning(f"Could not extract year from filename {filename}: {e}")
        return str(datetime.now().year)

def update_parking_service_file_info(conn, parking_service_id, filename, file_path, file_size, import_status, user_id):
    """Update ParkingService with file information"""
    try:
        cur = conn.cursor()
        
        # Get file stats
        mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if filename.endswith('.xlsx') else "application/vnd.ms-excel"
        
        update_sql = """
        UPDATE "ParkingService" 
        SET 
            "originalFileName" = %s,
            "originalFilePath" = %s,
            "fileSize" = %s,
            "mimeType" = %s,
            "lastImportDate" = %s,
            "importedBy" = %s,
            "importStatus" = %s,
            "updatedAt" = %s
        WHERE "id" = %s
        """
        
        cur.execute(update_sql, (
            filename,
            file_path,
            file_size,
            mime_type,
            datetime.now(),
            user_id,
            import_status,
            datetime.now(),
            parking_service_id
        ))
        
        conn.commit()
        logging.info(f"Updated ParkingService file info for: {parking_service_id}")
        cur.close()
        
    except Exception as e:
        logging.error(f"Error updating ParkingService file info: {e}")
        try:
            conn.rollback()
        except:
            pass

def sanitize_parking_record(row):
    """Sanitize parking records"""
    try:
        original_service_name = str(row.get('serviceName', ''))
        service_code = extract_service_code(original_service_name)
        
        return {
            'parkingServiceId': row.get('parkingServiceId', ''),
            'serviceId': row.get('serviceId', ''),  # Ensure this is included
            'date': convert_date_format(row.get('date', '')),
            'group': str(row.get('group', '')),
            'serviceName': service_code,
            'price': convert_to_float(row.get('price', 0)) or 0,
            'quantity': convert_to_float(row.get('quantity', 0)) or 0,
            'amount': convert_to_float(row.get('amount', 0)) or 0
        }
    except Exception as e:
        logging.error(f"Sanitization error: {e}")
        return None

def process_excel(input_file):
    """Process Excel files"""
    conn = None
    try:
        conn = get_db_connection()
        # FIX 2: Get user ID early and safely
        current_user_id = get_current_user()
        if not current_user_id:
            logging.error("No valid user ID available for logging")
            return []
        
        log_to_database(
            conn,
            entity_type="System",
            entity_id="start",
            action="PROCESS_START",
            subject=f"Started processing {os.path.basename(input_file)}",
            user_id=current_user_id
        )
        
        df = pd.read_excel(input_file, sheet_name=3, header=None)
        rows = df.fillna("").values.tolist()
        
        if not rows:
            return []

        header = [str(x).strip() for x in rows[0]]
        date_cols = header[3:-1] if header[-1].upper() == "TOTAL" else header[3:]

        current_group = "prepaid"
        output_records = []
        
        provider_name = extract_parking_provider(os.path.basename(input_file))
        logging.info(f"Extracted provider: {provider_name}")
        
        parking_service_id, ps_created = get_or_create_parking_service(conn, provider_name)
        if not parking_service_id:
            raise Exception(f"Could not get/create parking service for {provider_name}")

        # Update ParkingService with file information
        file_size = os.path.getsize(input_file)
        update_parking_service_file_info(
            conn, 
            parking_service_id, 
            os.path.basename(input_file), 
            input_file, 
            file_size, 
            "in_progress", 
            current_user_id
        )

        if ps_created:
            log_to_database(
                conn,
                entity_type="ParkingService",
                entity_id=parking_service_id,
                action="CREATE",
                subject=f"Created parking service for {provider_name}",
                user_id=current_user_id
            )

        service_codes_in_file = set()

        i = 1
        while i < len(rows):
            row = [str(x).strip() for x in rows[i]]
            if not any(row):
                i += 1
                continue

            if len(row) > 1 and "total" in row[1].lower():
                i += 1
                continue

            if i == 1 and ("servis" in row[0].lower() or "izveštaj" in row[0].lower()):
                i += 1
                continue

            for kw in ["prepaid", "postpaid", "total"]:
                if kw in row[0].lower():
                    current_group = kw
                    i += 1
                    break
            else:
                if row[0]:
                    service_name = row[0]
                    service_code = extract_service_code(service_name)
                    service_codes_in_file.add(service_code)
                    
                    price = convert_to_float(row[1])

                    quantity_values = row[3:-1] if header[-1].upper() == "TOTAL" else row[3:]

                    if i + 1 < len(rows):
                        next_row = [str(x).strip() for x in rows[i+1]]
                        amount_values = next_row[3:-1] if header[-1].upper() == "TOTAL" else next_row[3:]
                    else:
                        amount_values = ["" for _ in range(len(date_cols))]

                    for j, date_val in enumerate(date_cols):
                        cleaned_date = clean_date(date_val)
                        quantity = convert_to_float(quantity_values[j]) if j < len(quantity_values) else None
                        amount = convert_to_float(amount_values[j]) if j < len(amount_values) else None
                        
                        if quantity is not None and quantity > 0 and current_group == "prepaid":
                            record = {
                                "parkingServiceId": parking_service_id,
                                "serviceId": None,
                                "group": current_group,
                                "serviceName": service_name,
                                "serviceCode": service_code,
                                "price": price,
                                "date": cleaned_date,
                                "quantity": quantity,
                                "amount": amount
                            }
                            output_records.append(record)
                    i += 2
                else:
                    i += 1

        service_id_mapping = {}
        for service_code in service_codes_in_file:
            service_id, service_created = get_or_create_service(conn, service_code, 'PARKING', 'PREPAID')
            if service_id:
                service_id_mapping[service_code] = service_id
                
                if service_created:
                    log_to_database(
                        conn,
                        entity_type="Service",
                        entity_id=service_id,
                        action="CREATE",
                        subject=f"Created service {service_code}",
                        user_id=current_user_id
                    )
                
                service_contract_id, contract_created = get_or_create_service_contract(conn, service_id, parking_service_id)
                if service_contract_id and contract_created:
                    log_to_database(
                        conn,
                        entity_type="ServiceContract",
                        entity_id=service_contract_id,
                        action="CREATE",
                        subject=f"Created service contract for {service_code}",
                        user_id=current_user_id
                    )

        for record in output_records:
            service_code = record.get('serviceCode')
            if service_code in service_id_mapping:
                record['serviceId'] = service_id_mapping[service_code]
            record.pop('serviceCode', None)

        logging.info(f"Processed {input_file}: {len(output_records)} records")
        
        # Return both records and metadata needed for file organization
        return {
            'records': output_records,
            'parking_service_id': parking_service_id,
            'provider_name': provider_name,
            'filename': os.path.basename(input_file),
            'current_user_id': current_user_id
        }
        
    except Exception as e:
        logging.error(f"Error processing file {input_file}: {e}")
        # FIX 2: Safely handle user ID in error logging
        try:
            user_id = current_user_id if 'current_user_id' in locals() else get_current_user()
            if conn:
                log_to_database(
                    conn,
                    entity_type="System",
                    entity_id="error",
                    action="PROCESS_ERROR",
                    subject=f"Error processing {os.path.basename(input_file)}",
                    description=str(e),
                    severity="ERROR",
                    user_id=user_id
                )
        except Exception as log_error:
            logging.error(f"Failed to log error: {log_error}")
        raise
    finally:
        if conn:
            return_db_connection(conn)

def save_to_csv(data, output_file):
    """Save data to CSV"""
    if not data:
        return

    fieldnames = ["parkingServiceId", "serviceId", "group", "serviceName", "price", "date", "quantity", "amount"]
    try:
        with open(output_file, "w", newline="", encoding="utf-8-sig") as fout:
            writer = csv.DictWriter(fout, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
    except Exception as e:
        logging.error(f"Error saving CSV: {e}")
        raise

def import_to_postgresql(csv_path):
    """Import data to PostgreSQL"""
    conn = None
    try:
        conn = get_db_connection()
        df = pd.read_csv(csv_path)
        
        sanitized_data = []
        for _, row in df.iterrows():
            sanitized_row = sanitize_parking_record(row)
            if (sanitized_row and sanitized_row['date'] and 
                sanitized_row['quantity'] > 0 and 
                sanitized_row['group'] == 'prepaid'):
                sanitized_data.append(sanitized_row)
                logging.info(f"First record data: {sanitized_data[0]}")

        if not sanitized_data:
            return

        cur = conn.cursor()
        inserted_count = 0
        updated_count = 0
        error_count = 0
        
        for i, record in enumerate(sanitized_data):
            try:
                upsert_sql = """
                INSERT INTO "ParkingTransaction" (
                    "id", "parkingServiceId", "date", "group", "serviceName", 
                    "price", "quantity", "amount", "createdAt", "serviceId"
                )
                VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT ("parkingServiceId", "date", "serviceName", "group")
                DO UPDATE SET
                    "price" = EXCLUDED."price",
                    "quantity" = EXCLUDED."quantity",
                    "amount" = EXCLUDED."amount"
                RETURNING (xmax = 0) AS inserted;
                """
                
                cur.execute(upsert_sql, (
                    record['parkingServiceId'],
                    record['date'],
                    record['group'],
                    record['serviceName'],
                    record['price'],
                    record['quantity'],
                    record['amount'],
                    datetime.now(),
                    record['serviceId']
                ))
                
                result = cur.fetchone()
                if result and result[0]:
                    inserted_count += 1
                else:
                    updated_count += 1
                
                if (i + 1) % 50 == 0:
                    conn.commit()
                    
            except Exception as e:
                error_count += 1
                logging.error(f"Error on record {i}: {e}")
                try:
                    conn.rollback()
                    cur = conn.cursor()
                except:
                    pass
                continue

        try:
            conn.commit()
        except Exception as e:
            logging.error(f"Final commit failed: {e}")
            
        cur.close()
        
        logging.info(f"Import completed: {inserted_count} inserted, {updated_count} updated, {error_count} errors")

    except Exception as e:
        logging.exception("IMPORT FAILURE:")
        raise
    finally:
        if conn:
            return_db_connection(conn)

def create_parking_service_directory(provider_name, year):
    """Create directory structure for parking service"""
    try:
        # Sanitize provider name for filesystem
        safe_provider_name = re.sub(r'[^\w\s-]', '', provider_name)
        safe_provider_name = re.sub(r'[-\s]+', '-', safe_provider_name)
        
        # Create directory path
        base_path = os.path.join(PROJECT_ROOT, "public", "parking-servis", safe_provider_name, "reports", year)
        
        # Create directory if it doesn't exist
        os.makedirs(base_path, exist_ok=True)
        
        logging.info(f"Created directory structure: {base_path}")
        return base_path
        
    except Exception as e:
        logging.error(f"Error creating directory structure: {e}")
        return None

def move_file_to_service_directory(source_file, parking_service_id, provider_name, filename, user_id):
    """Move processed file to parking service directory structure"""
    conn = None
    try:
        # Extract year from filename
        year = extract_year_from_filename(filename)
        
        # Create directory structure
        target_dir = create_parking_service_directory(provider_name, year)
        if not target_dir:
            raise Exception(f"Could not create directory for {provider_name}")
        
        # Move file to target directory
        target_file = os.path.join(target_dir, filename)
        shutil.move(source_file, target_file)
        
        # Update database with new file location
        conn = get_db_connection()
        cur = conn.cursor()
        
        update_sql = """
        UPDATE "ParkingService" 
        SET 
            "originalFilePath" = %s,
            "importStatus" = %s,
            "updatedAt" = %s
        WHERE "id" = %s
        """
        
        cur.execute(update_sql, (
            target_file,
            "completed",
            datetime.now(),
            parking_service_id
        ))
        
        conn.commit()
        cur.close()
        
        # Log the successful move
        log_to_database(
            conn,
            entity_type="ParkingService",
            entity_id=parking_service_id,
            action="FILE_MOVED",
            subject=f"File moved to {target_file}",
            user_id=user_id
        )
        
        logging.info(f"File moved successfully: {source_file} -> {target_file}")
        return target_file
        
    except Exception as e:
        logging.error(f"Error moving file {source_file}: {e}")
        # If move fails, try to move to error folder
        try:
            error_file = os.path.join(ERROR_FOLDER, filename)
            shutil.move(source_file, error_file)
            logging.info(f"File moved to error folder: {error_file}")
        except Exception as move_error:
            logging.error(f"Could not move file to error folder: {move_error}")
        
        if conn:
            try:
                log_to_database(
                    conn,
                    entity_type="ParkingService",
                    entity_id=parking_service_id,
                    action="FILE_MOVE_ERROR",
                    subject=f"Failed to move file {filename}",
                    description=str(e),
                    severity="ERROR",
                    user_id=user_id
                )
            except:
                pass
        
        return None
    finally:
        if conn:
            return_db_connection(conn)

def main():
    """Main function to process all files"""
    try:
        # Test database connection first
        if not test_database_connection():
            logging.error("Database connection failed. Exiting.")
            return
        
        # Initialize connection pool
        init_db_pool()
        
        # Get all Excel files from input folder
        excel_files = glob.glob(os.path.join(FOLDER_PATH, "*.xlsx"))
        excel_files.extend(glob.glob(os.path.join(FOLDER_PATH, "*.xls")))
        
        if not excel_files:
            logging.info("No Excel files found in input folder")
            return
        
        logging.info(f"Found {len(excel_files)} Excel files to process")
        
        all_records = []
        
        for file_path in excel_files:
            try:
                logging.info(f"Processing file: {os.path.basename(file_path)}")
                
                # Process the Excel file
                result = process_excel(file_path)
                
                if result and result.get('records'):
                    all_records.extend(result['records'])
                    
                    # Move file to appropriate directory structure
                    move_file_to_service_directory(
                        file_path,
                        result['parking_service_id'],
                        result['provider_name'],
                        result['filename'],
                        result['current_user_id']
                    )
                    
                    logging.info(f"Successfully processed and moved: {result['filename']}")
                else:
                    # Move to error folder if no records
                    error_file = os.path.join(ERROR_FOLDER, os.path.basename(file_path))
                    shutil.move(file_path, error_file)
                    logging.warning(f"No records found, moved to error folder: {error_file}")
                    
            except Exception as e:
                logging.error(f"Error processing file {os.path.basename(file_path)}: {e}")
                # Move problematic file to error folder
                try:
                    error_file = os.path.join(ERROR_FOLDER, os.path.basename(file_path))
                    shutil.move(file_path, error_file)
                    logging.info(f"Moved problematic file to error folder: {error_file}")
                except Exception as move_error:
                    logging.error(f"Could not move file to error folder: {move_error}")
                continue
        
        # Save all records to CSV
        if all_records:
            save_to_csv(all_records, OUTPUT_FILE)
            logging.info(f"Saved {len(all_records)} records to {OUTPUT_FILE}")
            
            # Import to PostgreSQL
            import_to_postgresql(OUTPUT_FILE)
            logging.info("Data import to PostgreSQL completed")
        else:
            logging.info("No records to save")
            
    except Exception as e:
        logging.error(f"Main process error: {e}")
        raise
    finally:
        # Close connection pool
        if connection_pool:
            connection_pool.closeall()
            logging.info("Database connection pool closed")

if __name__ == "__main__":
    main()