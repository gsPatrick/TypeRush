import { forwardRef } from "react";
import Link from "next/link";
import styles from "./Button.module.css";

/** Botão ou link com o mesmo visual. Com `href`, vira <Link>. */
const Button = forwardRef(function Button({ variant = "primary", size = "md", className = "", href, children, ...rest }, ref) {
  const cls = [styles.button, styles[variant], styles[size], className].join(" ");
  if (href) {
    return (
      <Link ref={ref} href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} type="button" className={cls} {...rest}>
      {children}
    </button>
  );
});

export default Button;
