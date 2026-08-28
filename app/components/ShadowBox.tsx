type ShadowBoxProps = {
  children?: React.ReactNode;
  label?: string;
  width: number;
  height: number;
};
export function ShadowBox({ children, label, width, height }: ShadowBoxProps) {
  return (
    <div className="group inline-block text-center">
      <div
        className="rounded-[20px] border border-gray-300 bg-white p-2 shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:border-border-primary dark:bg-transparent dark:shadow-none"
        style={{ width, height }}
      >
        <div
          className="grid h-full place-items-center rounded-xl border-2 border-[#A5AEB81F]/10 bg-[#E7E9ED] dark:bg-[#1b1c21]"
          style={{ boxShadow: "0px 2px 1.5px 0px #A5AEB852 inset" }}
        >
          {children ? children : null}
        </div>
      </div>
      {label ? <p className="mt-3 text-sm text-gray-500">{label}</p> : null}
    </div>
  );
}
