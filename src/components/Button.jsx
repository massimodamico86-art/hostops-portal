

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, type = 'button' }) => {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
    success: 'bg-green-500 text-white hover:bg-green-600',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  };
  const sizes = {
    sm: 'px-2 py-1.5 text-xs sm:px-3 sm:text-sm',
    md: 'px-3 py-2 text-sm sm:px-4 sm:text-base',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-colors flex items-center justify-center gap-1 sm:gap-2 disabled:cursor-not-allowed touch-manipulation ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
