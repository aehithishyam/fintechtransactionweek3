import { useAuth } from '../context';
import { DEMO_USERS, ROLE_LABELS } from '../constants';
import type { UserRole } from '../types';

export function RoleSelector() {
  const { currentUser, switchRole } = useAuth();

  return (
    <div className="role-selector"> 
      <label className="role-selector-label">
        Current Role:
      </label>
      <select
        className="role-selector-select"
        value={currentUser.role}
        onChange={(e) => switchRole(e.target.value as UserRole)}
      >
        {DEMO_USERS.map(user => (
          <option key={user.id} value={user.role}>
            {ROLE_LABELS[user.role]} - {user.name}
          </option>
        ))}
      </select>
      <div className="role-selector-info">
        <span className="role-badge">{currentUser.role}</span>
        <span className="role-department">{currentUser.department}</span>
      </div>
    </div>
  );
}

export default RoleSelector;

