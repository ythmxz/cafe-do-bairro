"use client";

type SelectCakeButtonProps = {
  productName: string;
};

export function SelectCakeButton({ productName }: SelectCakeButtonProps) {
  function handleClick(): void {
    window.dispatchEvent(
      new CustomEvent("select-product", { detail: productName }),
    );
    document
      .getElementById("encomendar")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-terracotta hover:text-espresso"
    >
      Encomendar este bolo
      <span aria-hidden="true">→</span>
    </button>
  );
}
