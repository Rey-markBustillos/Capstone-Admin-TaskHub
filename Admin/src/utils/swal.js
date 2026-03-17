import Swal from 'sweetalert2';

export const showAlert = (icon, title, text) =>
  Swal.fire({
    icon,
    title,
    text,
    confirmButtonColor: '#2563eb',
  });

export const showConfirm = async (title, text, options = {}) => {
  const result = await Swal.fire({
    icon: options.icon || 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || 'Yes',
    cancelButtonText: options.cancelButtonText || 'Cancel',
    confirmButtonColor: options.confirmButtonColor || '#dc2626',
    cancelButtonColor: options.cancelButtonColor || '#6b7280',
  });

  return result.isConfirmed;
};

export const showPrompt = async (title, text, options = {}) => {
  const result = await Swal.fire({
    title,
    text,
    input: 'text',
    inputLabel: options.inputLabel,
    inputPlaceholder: options.inputPlaceholder || '',
    inputValue: options.inputValue || '',
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || 'Submit',
    cancelButtonText: options.cancelButtonText || 'Cancel',
    confirmButtonColor: options.confirmButtonColor || '#2563eb',
    cancelButtonColor: options.cancelButtonColor || '#6b7280',
    inputValidator: (value) => {
      if (options.required && !value?.trim()) {
        return options.requiredMessage || 'This field is required.';
      }
      return undefined;
    },
  });

  if (!result.isConfirmed) return null;
  return result.value;
};
