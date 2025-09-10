import { Button } from "@/components/ui/button";
import { CalendarIcon, Settings, Share, Download } from "lucide-react";

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onExportPDF: () => void;
  onShare: () => void;
  onSettings: () => void;
  isAdmin?: boolean;
}

export default function Header({ 
  currentMonth, 
  onMonthChange, 
  onExportPDF, 
  onShare, 
  onSettings, 
  isAdmin = false 
}: HeaderProps) {
  const months = [
    "January 2024", "February 2024", "March 2024", "April 2024",
    "May 2024", "June 2024", "July 2024", "August 2024",
    "September 2024", "October 2024", "November 2024", "December 2024"
  ];

  return (
    <header className="bg-white border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold">
              <span className="text-primary">EHS</span>
              <span className="text-destructive ml-1">LifeFlight</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Adult MCP Self-Scheduler
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select 
            value={currentMonth} 
            onChange={(e) => onMonthChange(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="select-month"
          >
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={onShare}
            data-testid="button-share"
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExportPDF}
            data-testid="button-export-pdf"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>

          {isAdmin && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSettings}
              data-testid="button-admin-settings"
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}