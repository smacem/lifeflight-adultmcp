import { Button } from "@/components/ui/button";
import { CalendarIcon, Settings, Share, Download } from "lucide-react";
import logoImage from "@assets/IMG_4131_1757550683322.png";

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
    <header className="bg-red-50 border-b border-border px-6 py-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center justify-center flex-1">
          <div className="flex items-center space-x-4">
            <img 
              src={logoImage} 
              alt="EHS LifeFlight Logo" 
              className="h-16 w-auto"
            />
            <div className="text-xl font-semibold text-foreground whitespace-nowrap">
              Adult MCP Self-Scheduler
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 flex-wrap justify-end">

          <Button 
            variant="outline" 
            size="sm" 
            onClick={onShare}
            className="border-red-200 text-red-600"
            data-testid="button-share"
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExportPDF}
            className="border-red-200 text-red-600"
            data-testid="button-export-pdf"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>

        </div>
      </div>
    </header>
  );
}