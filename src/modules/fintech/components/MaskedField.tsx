import { useAuth } from '../context';
import { maskCardNumber, maskAccountNumber, maskEmail, maskName, maskAmount, formatAmount } from '../utils';

type MaskType = 'card' | 'account' | 'email' | 'name' | 'amount';

interface MaskedFieldProps {
  value: string | number;
  type: MaskType;
  currency?: string;
  className?: string;
}

export function MaskedField({ value, type, currency = 'USD', className = '' }: MaskedFieldProps) {
  const { hasPermission } = useAuth();
  const canViewFull = hasPermission('view_full_data');

  const getMaskedValue = (): string => {
    if (canViewFull) {
      if (type === 'amount' && typeof value === 'number') {
        return formatAmount(value, currency);
      }
      if (type === 'card') {
        return `•••• •••• •••• ${value}`;
      }
      return String(value);
    }

    switch (type) {
      case 'card':
        return maskCardNumber(String(value));
      case 'account':
        return maskAccountNumber(String(value));
      case 'email':
        return maskEmail(String(value));
      case 'name':
        return maskName(String(value));
      case 'amount':
        if (typeof value === 'number') {
          return maskAmount(value);
        }
        return String(value);
      default:
        return String(value);
    }
  };

  return (
    <span className={`masked-field ${canViewFull ? '' : 'masked'} ${className}`}>
      {getMaskedValue()}
      {!canViewFull && (
        <span className="masked-indicator" title="Data masked for security">
          🔒
        </span>
      )}
    </span>
  );
}

export default MaskedField;
