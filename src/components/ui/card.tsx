import { cn } from "@/lib/utils";
import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("bg-white rounded-xl border border-gray-200 p-6 shadow-sm", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

export const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-semibold text-lg">{children}</h3>
);

export const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

export const CardFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2 justify-end">
    {children}
  </div>
);
