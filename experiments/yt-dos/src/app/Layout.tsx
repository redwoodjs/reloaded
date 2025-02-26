import React from "react";

export function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <main className="min-h-screen">
        <div className="w-full h-full">{children}</div>
      </main>
    </div>
  );
}
