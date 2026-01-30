interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}
 
function Header({ title }: HeaderProps) {
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 className="header-title">{title}</h1>
      </div>
      {/* <div className="header-user">
        <span>Admin User</span>
        <div className="header-avatar">A</div>
      </div> */}
    </header>
  );
}

export default Header;

