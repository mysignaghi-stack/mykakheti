import React from 'react';
import Snackbar from './Snackbar';

interface SnackbarWrapperProps {
  open: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

const SnackbarWrapper: React.FC<SnackbarWrapperProps> = ({ open, message, type, onClose }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{ position: 'fixed', zIndex: 9999, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
    >
      <Snackbar open={open} message={message} type={type} onClose={onClose} />
    </div>
  );
};

export default SnackbarWrapper;
