// app/(protected)/test-buttons/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Button Test Page | Dashboard",
  description: "Test page for polished button styles",
};

export default function ButtonTestPage() {
  const buttons = [
    {
      label: "Ocean Waves",
      gradient: "from-[#667eea] to-[#764ba2]",
      shadowColor: "purple-500",
      text: "Get Started"
    },
    {
      label: "Emerald Forest",
      gradient: "from-[#11998e] to-[#38ef7d]",
      shadowColor: "emerald-500",
      text: "Explore More"
    },
    {
      label: "Sunset Glow",
      gradient: "from-[#f093fb] to-[#f5576c]",
      shadowColor: "pink-500",
      text: "Learn More"
    },
    {
      label: "Deep Ocean",
      gradient: "from-blue-900 via-blue-800 to-blue-600",
      shadowColor: "blue-600",
      text: "Dive In"
    },
    {
      label: "Golden Hour",
      gradient: "from-[#f7971e] to-[#ffd200]",
      shadowColor: "yellow-500",
      text: "Discover"
    },
    {
      label: "Chrome Polish",
      gradient: "from-gray-400 to-gray-700",
      shadowColor: "gray-600",
      text: "Premium"
    },
    {
      label: "Royal Purple",
      gradient: "from-purple-600 to-purple-500",
      shadowColor: "purple-500",
      text: "Upgrade"
    },
    {
      label: "Fresh Mint",
      gradient: "from-teal-400 to-cyan-500",
      shadowColor: "teal-400",
      text: "Refresh"
    },
    {
      label: "Electric Lime",
      gradient: "from-lime-400 via-lime-500 to-lime-300",
      shadowColor: "lime-400",
      text: "Energise"
    },
    {
      label: "Soft Lavender",
      gradient: "from-gray-400 via-purple-400 to-purple-500",
      shadowColor: "purple-400",
      text: "Relax"
    },
    {
      label: "Fire Ember",
      gradient: "from-orange-600 via-red-500 to-orange-400",
      shadowColor: "orange-500",
      text: "Ignite"
    },
    {
      label: "Forest Depths",
      gradient: "from-[#134e5e] to-[#71b280]",
      shadowColor: "green-600",
      text: "Explore"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-wider">
            Polished Button Collection
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-medium tracking-wide">
            Beautiful, shiny UI components with gradient backgrounds
          </p>
        </div>

        {/* Button Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {buttons.map((button, index) => (
            <div key={index} className="flex flex-col items-center gap-4">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                {button.label}
              </span>
              <button
                className={`
                  relative overflow-hidden
                  inline-flex items-center justify-center
                  px-8 py-4 rounded-xl
                  text-white font-semibold text-base
                  bg-gradient-to-r ${button.gradient}
                  shadow-lg shadow-${button.shadowColor}/30
                  hover:shadow-xl hover:shadow-${button.shadowColor}/40
                  hover:-translate-y-1
                  active:translate-y-0
                  transition-all duration-300 ease-in-out
                  min-w-[200px]
                  before:absolute before:inset-0
                  before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent
                  before:translate-x-[-200%]
                  hover:before:translate-x-[200%]
                  before:transition-transform before:duration-700
                `}
              >
                {button.text}
              </button>
            </div>
          ))}
        </div>

        {/* Usage Instructions */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            How to Use
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            These buttons use Tailwind CSS classes for gradients and animations. 
            Simply copy the button classes and adjust the gradient colors to match your design.
          </p>
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <code className="text-purple-600 dark:text-purple-400">
              {`<button className="
  bg-gradient-to-r from-purple-600 to-blue-500
  hover:from-purple-700 hover:to-blue-600
  shadow-lg shadow-purple-500/30
  hover:shadow-xl hover:shadow-purple-500/40
  hover:-translate-y-1
  transition-all duration-300
  px-8 py-4 rounded-xl
  text-white font-semibold
">
  Button Text
</button>`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}