import Header from '../Header';

export default function HeaderExample() {
  const handleMonthChange = (month: string) => {
    console.log('Month changed to:', month);
  };

  const handleExportPDF = () => {
    console.log('Export PDF triggered');
  };

  const handleShare = () => {
    console.log('Share triggered');
  };

  const handleSettings = () => {
    console.log('Settings triggered');
  };

  return (
    <Header 
      currentMonth="January 2024"
      onMonthChange={handleMonthChange}
      onExportPDF={handleExportPDF}
      onShare={handleShare}
      onSettings={handleSettings}
      isAdmin={true}
    />
  );
}