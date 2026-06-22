import { UserMenu } from "./user-menu"

export function AuthedHeader() {
  return (
    <header
      className="bg-opacity-70 desktop:rounded-t-[10px] top-0 z-50 flex h-[70px] items-center justify-between bg-background px-6 backdrop-blur-xl backdrop-filter transition-transform md:m-0 md:border-b md:backdrop-blur-none md:backdrop-filter"
      style={{
        transform: "translateY(calc(var(--header-offset, 0px) * -1))",
        transitionDuration: "var(--header-transition, 200ms)",
        willChange: "transform",
      }}
    >
      <div className="ml-auto flex">
        <UserMenu />
      </div>
    </header>
  )
}
