// lib/mcp/ai-response-formatter.ts

/**
 * Formatuje AI odgovore sa boljim stilom i strukturom
 */
export class AIResponseFormatter {
  
  /**
   * Format data za prikaz u chat interfejsu
   */
  static formatForChat(toolName: string, data: any): string {
    if (!data) return '❌ Nema podataka.';

    const formatters: Record<string, (data: any) => string> = {
      get_contracts: this.formatContracts,
      get_providers: this.formatProviders,
      get_complaints: this.formatComplaints,
      search_entities: this.formatSearchResults,
      get_user_stats: this.formatUserStats,
      get_activity_overview: this.formatActivityOverview,
      get_financial_summary: this.formatFinancialSummary,
      get_system_health: this.formatSystemHealth
    };

    const formatter = formatters[toolName];
    return formatter ? formatter(data) : this.formatGeneric(data);
  }

  /**
   * Contracts formatting
   */
  private static formatContracts(data: any): string {
    if (!data.contracts?.length) {
      return '📋 Nema pronađenih ugovora.';
    }

    const { contracts, total, displayed, summary } = data;
    let result = `📋 **UGOVORI** (prikazano ${displayed} od ${total})\n\n`;

    // Summary badges
    if (summary) {
      const badges = [
        summary.active > 0 ? `✅ ${summary.active} aktivnih` : null,
        summary.expired > 0 ? `⏰ ${summary.expired} isteklih` : null,
        summary.pending > 0 ? `⏳ ${summary.pending} pending` : null
      ].filter(Boolean);
      
      if (badges.length > 0) {
        result += `${badges.join(' • ')}\n\n`;
      }
    }

    // List contracts
    contracts.slice(0, 8).forEach((c: any, idx: number) => {
      result += `**${idx + 1}. ${c.name}**\n`;
      result += `   📄 Broj: ${c.contractNumber || 'N/A'}\n`;
      result += `   ${this.getStatusEmoji(c.status)} Status: ${c.status}\n`;
      result += `   🏢 Provajder: ${c.provider?.name || 'N/A'}\n`;
      
      if (c.startDate && c.endDate) {
        const start = new Date(c.startDate).toLocaleDateString('sr-RS');
        const end = new Date(c.endDate).toLocaleDateString('sr-RS');
        result += `   📅 Period: ${start} - ${end}\n`;
      }
      
      if (c.revenuePercentage) {
        result += `   💰 Revenue: ${c.revenuePercentage}%\n`;
      }
      
      result += '\n';
    });

    if (contracts.length > 8) {
      result += `_... i još ${contracts.length - 8} ugovora_\n`;
    }

    return result;
  }

  /**
   * Providers formatting
   */
  private static formatProviders(data: any): string {
    if (!data.providers?.length) {
      return '🏢 Nema pronađenih provajdera.';
    }

    const { providers, total, displayed } = data;
    let result = `🏢 **PROVAJDERI** (prikazano ${displayed} od ${total})\n\n`;

    providers.slice(0, 8).forEach((p: any, idx: number) => {
      const status = p.isActive ? '✅ Aktivan' : '❌ Neaktivan';
      
      result += `**${idx + 1}. ${p.name}** ${status}\n`;
      
      if (p.email) {
        result += `   📧 ${p.email}\n`;
      }
      
      if (p.phone) {
        result += `   📞 ${p.phone}\n`;
      }
      
      if (p._count) {
        const counts = [];
        if (p._count.contracts > 0) counts.push(`${p._count.contracts} ugovora`);
        if (p._count.complaints > 0) counts.push(`${p._count.complaints} žalbi`);
        if (counts.length > 0) {
          result += `   📊 ${counts.join(', ')}\n`;
        }
      }
      
      result += '\n';
    });

    if (providers.length > 8) {
      result += `_... i još ${providers.length - 8} provajdera_\n`;
    }

    return result;
  }

  /**
   * Complaints formatting
   */
  private static formatComplaints(data: any): string {
    if (!data.complaints?.length) {
      return '📝 Nema pronađenih žalbi.';
    }

    const { complaints, total, displayed, summary } = data;
    let result = `📝 **ŽALBE** (prikazano ${displayed} od ${total})\n\n`;

    // Summary
    if (summary) {
      const badges = [
        summary.new > 0 ? `🆕 ${summary.new} novih` : null,
        summary.inProgress > 0 ? `⚙️ ${summary.inProgress} u toku` : null,
        summary.resolved > 0 ? `✅ ${summary.resolved} rešenih` : null
      ].filter(Boolean);
      
      if (badges.length > 0) {
        result += `${badges.join(' • ')}\n\n`;
      }
    }

    // List complaints
    complaints.slice(0, 8).forEach((c: any, idx: number) => {
      result += `**${idx + 1}. ${c.title}**\n`;
      result += `   ${this.getStatusEmoji(c.status)} Status: ${c.status}\n`;
      
      if (c.priority) {
        result += `   ${this.getPriorityEmoji(c.priority)} Prioritet: ${c.priority}\n`;
      }
      
      if (c.provider?.name) {
        result += `   🏢 Provajder: ${c.provider.name}\n`;
      }
      
      if (c.assignedAgent?.name) {
        result += `   👤 Agent: ${c.assignedAgent.name}\n`;
      }
      
      if (c.createdAt) {
        const date = new Date(c.createdAt).toLocaleDateString('sr-RS');
        result += `   📅 Kreirano: ${date}\n`;
      }
      
      result += '\n';
    });

    if (complaints.length > 8) {
      result += `_... i još ${complaints.length - 8} žalbi_\n`;
    }

    return result;
  }

  /**
   * Search results formatting
   */
  private static formatSearchResults(data: any): string {
    let result = `🔍 **REZULTATI PRETRAGE**\n\n`;
    let hasResults = false;

    // Contracts
    if (data.contracts?.length > 0) {
      hasResults = true;
      result += `📋 **Ugovori** (${data.contractsTotal}):\n`;
      data.contracts.slice(0, 5).forEach((c: any) => {
        result += `   • ${c.name} - ${c.status}\n`;
      });
      result += '\n';
    }

    // Providers
    if (data.providers?.length > 0) {
      hasResults = true;
      result += `🏢 **Provajderi** (${data.providersTotal}):\n`;
      data.providers.slice(0, 5).forEach((p: any) => {
        const status = p.isActive ? '✅' : '❌';
        result += `   • ${p.name} ${status}\n`;
      });
      result += '\n';
    }

    // Complaints
    if (data.complaints?.length > 0) {
      hasResults = true;
      result += `📝 **Žalbe** (${data.complaintsTotal}):\n`;
      data.complaints.slice(0, 5).forEach((c: any) => {
        result += `   • ${c.title} - ${c.status}\n`;
      });
      result += '\n';
    }

    // Humanitarian Orgs
    if (data.humanitarianOrgs?.length > 0) {
      hasResults = true;
      result += `🤝 **Humanitarne org.** (${data.humanitarianOrgsTotal}):\n`;
      data.humanitarianOrgs.slice(0, 5).forEach((h: any) => {
        result += `   • ${h.name}`;
        if (h.shortNumber) result += ` (${h.shortNumber})`;
        result += '\n';
      });
      result += '\n';
    }

    if (!hasResults) {
      return '🔍 Nema rezultata pretrage. Pokušajte sa drugim pojmom.';
    }

    return result;
  }

  /**
   * User stats formatting
   */
  private static formatUserStats(data: any): string {
    const { period, stats } = data;
    
    let result = `📊 **TVOJA STATISTIKA**\n`;
    result += `📅 Period: ${this.translatePeriod(period)}\n\n`;
    
    result += `📋 Kreirani ugovori: **${stats.contractsCreated}**\n`;
    result += `📝 Podnesene žalbe: **${stats.complaintsSubmitted}**\n`;
    result += `⚡ Ukupne aktivnosti: **${stats.activitiesCount}**\n`;
    
    return result;
  }

  /**
   * Activity overview formatting
   */
  private static formatActivityOverview(data: any): string {
    const { period, overview } = data;
    
    let result = `📊 **PREGLED AKTIVNOSTI**\n`;
    result += `📅 Period: ${this.translatePeriod(period)}\n\n`;
    
    const items = [
      { emoji: '📋', label: 'Novi ugovori', value: overview.newContracts },
      { emoji: '⚠️', label: 'Ugovori koji ističu (30 dana)', value: overview.expiringContracts },
      { emoji: '📝', label: 'Nove žalbe', value: overview.newComplaints },
      { emoji: '🔄', label: 'Aktivna obnavljanja', value: overview.activeRenewals },
      { emoji: '⚡', label: 'Nedavne aktivnosti', value: overview.recentActivities }
    ];

    items.forEach(item => {
      if (item.value > 0) {
        result += `${item.emoji} ${item.label}: **${item.value}**\n`;
      }
    });

    return result;
  }

  /**
   * Financial summary formatting
   */
  private static formatFinancialSummary(data: any): string {
    const { summary } = data;
    
    let result = `💰 **FINANSIJSKI PREGLED**\n\n`;
    
    result += `📋 Ukupno ugovora: **${summary.totalContracts}**\n`;
    result += `💵 Ukupan revenue share: **${summary.totalRevenueShare.toFixed(2)}%**\n`;
    result += `📊 Prosečan revenue share: **${summary.averageRevenueShare.toFixed(2)}%**\n`;
    
    return result;
  }

  /**
   * System health formatting
   */
  private static formatSystemHealth(data: any): string {
    const { system } = data;
    
    let result = `🏥 **ZDRAVLJE SISTEMA**\n\n`;
    
    result += `👥 **Korisnici:**\n`;
    result += `   • Ukupno: ${system.users.total}\n`;
    result += `   • Aktivni: ${system.users.active}\n\n`;
    
    result += `📋 **Ugovori:**\n`;
    result += `   • Ukupno: ${system.contracts.total}\n`;
    result += `   • Aktivni: ${system.contracts.active}\n\n`;
    
    result += `📝 **Žalbe:**\n`;
    result += `   • Na čekanju: ${system.complaints.pending}\n\n`;
    
    result += `✅ Sistem radi normalno`;
    
    return result;
  }

  /**
   * Generic formatting za nepoznate tool response-ove
   */
  private static formatGeneric(data: any): string {
    if (typeof data !== 'object' || data === null) {
      return `✅ Rezultat: ${data}`;
    }

    const keys = Object.keys(data);
    
    // Ako ima malo ključeva, prikaži ih direktno
    if (keys.length <= 10) {
      let result = '✅ **Rezultat:**\n\n';
      keys.forEach(key => {
        const value = data[key];
        if (typeof value === 'object' && value !== null) {
          result += `• **${key}**: ${JSON.stringify(value)}\n`;
        } else {
          result += `• **${key}**: ${value}\n`;
        }
      });
      return result;
    }

    // Inače, prikaži JSON
    return `✅ **Rezultat:**\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
  }

  // ===================================
  // HELPER METHODS
  // ===================================

  private static getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      ACTIVE: '✅',
      EXPIRED: '⏰',
      PENDING: '⏳',
      TERMINATED: '❌',
      RENEWAL_IN_PROGRESS: '🔄',
      NEW: '🆕',
      ASSIGNED: '👤',
      IN_PROGRESS: '⚙️',
      RESOLVED: '✅',
      CLOSED: '🔒',
      REJECTED: '❌'
    };
    return emojis[status] || '📄';
  }

  private static getPriorityEmoji(priority: number): string {
    if (priority === 1) return '🔴';
    if (priority === 2) return '🟠';
    if (priority === 3) return '🟡';
    if (priority === 4) return '🟢';
    if (priority === 5) return '🔵';
    return '⚪';
  }

  private static translatePeriod(period: string): string {
    const translations: Record<string, string> = {
      today: 'Danas',
      week: 'Ova nedelja',
      month: 'Ovaj mesec',
      quarter: 'Ovaj kvartal',
      year: 'Ova godina'
    };
    return translations[period] || period;
  }

  /**
   * Format large numbers
   */
  static formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number, currency: string = 'RSD'): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Format date
   */
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Format datetime
   */
  static formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}