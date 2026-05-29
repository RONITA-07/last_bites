"use client";

import React from 'react';

export default function FloatingCard({ children, style, className = "", ...props }) {
  return (
    <div
      className={`floating-card hover-lift ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
