// utils/toast.js
import { toast } from 'react-toastify';

const defaultToastConfig = {
  className: 'custom-toast',
  bodyClassName: 'custom-toast-body',
  progressClassName: 'custom-toast-progress',
};

export const showToast = {
  success: (message, options = {}) => {
    toast.success(message, { ...defaultToastConfig, ...options });
  },
  
  error: (message, options = {}) => {
    toast.error(message, { ...defaultToastConfig, ...options });
  },
  
  info: (message, options = {}) => {
    toast.info(message, { ...defaultToastConfig, ...options });
  },
  
  warning: (message, options = {}) => {
    toast.warn(message, { ...defaultToastConfig, ...options });
  },
  
  // Generic toast
  show: (message, options = {}) => {
    toast(message, { ...defaultToastConfig, ...options });
  }
};

// Alternative: Single function approach
export const customToast = (type, message, options = {}) => {
  const config = { ...defaultToastConfig, ...options };
  
  switch (type) {
    case 'success':
      return toast.success(message, config);
    case 'error':
      return toast.error(message, config);
    case 'info':
      return toast.info(message, config);
    case 'warning':
      return toast.warn(message, config);
    default:
      return toast(message, config);
  }
};

// Usage Examples:
/*
// Method 1: Object approach
import { showToast } from '@/utils/toast';

showToast.success("Item Updated Successfully");
showToast.error("Something went wrong");
showToast.info("Loading data...");

// Method 2: Single function approach  
import { customToast } from '@/utils/toast';

customToast('success', "Item Updated Successfully");
customToast('error', "Something went wrong");

// Override default config if needed
showToast.success("Custom message", { 
  autoClose: 2000,
  position: 'top-center' 
});
*/