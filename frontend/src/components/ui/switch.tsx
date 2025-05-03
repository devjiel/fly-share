import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import "../../styles/styles.css"

function Switch(props: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root className="SwitchRoot" {...props}>
      <SwitchPrimitive.Thumb className="SwitchThumb" />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
