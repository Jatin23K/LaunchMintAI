import React from "react";
import { Icons } from "./Icons";

// Define allowed types based on Icons keys
export type FeatureType = "market" | "competitor" | "revenue" | "genui";

export interface FeatureCardProps {
  type: FeatureType;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ type, title, description }) => {
  // @ts-ignore - Icons is an object with mixed types (Components and functions)
  const Icon = Icons[type];

  return (
    <div className="flex flex-col items-center text-center p-6 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 group hover:-translate-y-1">
      <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
        <Icon />
      </div>

      <h3 className="text-white font-semibold text-lg">{title}</h3>

      <p className="text-gray-400 text-sm mt-1">{description}</p>
    </div>
  );
};
