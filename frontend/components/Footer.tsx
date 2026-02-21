import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-8 text-center border-t border-white/5 bg-[#0c0c12] mt-auto">
      <p className="text-zinc-500 text-sm">
        © {new Date().getFullYear()} LaunchMintAI — Built for Founders.
      </p>
    </footer>
  );
}
