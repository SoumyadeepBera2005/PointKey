export default function Button({ variant = 'primary', className = '', ...props }) {
  const cls = variant === 'outline' ? 'btn-outline' : 'btn-primary';
  return <button className={`${cls} ${className}`} {...props} />;
}
