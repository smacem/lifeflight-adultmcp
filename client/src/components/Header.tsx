import { Button } from "@/components/ui/button";
import { CalendarIcon, Settings, Share, Download } from "lucide-react";
import logoImage from "@assets/IMG_4131_1757550683322.png";

interface HeaderUser {
  id: string;
  name: string;
  role: 'physician' | 'learner';
}

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onExportPDF: () => void;
  onShare: () => void;
  onSettings: () => void;
  isAdmin?: boolean;
  users: HeaderUser[];
  activeMcpId?: string;
  onActiveMcpChange: (mcpId: string) => void;
}

export default function Header({ 
  currentMonth, 
  onMonthChange, 
  onExportPDF, 
  onShare, 
  onSettings, 
  isAdmin = false,
  users,
  activeMcpId,
  onActiveMcpChange
}: HeaderProps) {
  const months = [
    "January 2024", "February 2024", "March 2024", "April 2024",
    "May 2024", "June 2024", "July 2024", "August 2024",
    "September 2024", "October 2024", "November 2024", "December 2024"
  ];

  return (
    <header className="bg-white border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
          <img 
            src={logoImage} 
            alt="EHS LifeFlight Logo" 
            className="h-10 w-auto"
          />
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Adult MCP Self-Scheduler
          </div>
        </div>

        <div className="flex items-center space-x-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Active MCP:</label>
            <select 
              value={activeMcpId || ''} 
              onChange={(e) => onActiveMcpChange(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-48"
              data-testid="select-active-mcp"
            >
              <option value="">Select MCP</option>
              {users.filter(user => user.role === 'physician').map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

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

          {isAdmin && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSettings}
              className="border-red-200 text-red-600"
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