import { Button } from "@coin-archive/design-system/components/button";

export default function Home() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="font-bold text-2xl">Hello World</h1>
        <Button size="sm">Button</Button>
      </div>
    </div>
  );
}
