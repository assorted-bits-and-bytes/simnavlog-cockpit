import { GamepadUiView, RequiredProps, TVNode, UiViewProps } from "@efb/efb-api";
import { FSComponent, VNode } from "@microsoft/msfs-sdk";
// Copied in beside this file: see spike/README.md, step 2.
import "./probe.js";

declare const BASE_URL: string;

// Bump on every edit: the number on screen is how the edit-to-visible
// cycle (question 4) is timed.
const BUILD = "1";

declare global {
  interface Window {
    SimNavLogProbe: {
      run(
        container: HTMLElement,
        options: { build: string; fontBaseUrl: string }
      ): Promise<unknown>;
    };
  }
}

export class ProbePage extends GamepadUiView<
  HTMLDivElement,
  RequiredProps<UiViewProps, "appViewService">
> {
  public readonly tabName = ProbePage.name;

  private readonly probeRef = FSComponent.createRef<HTMLDivElement>();

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    window.SimNavLogProbe.run(this.probeRef.instance, {
      build: BUILD,
      fontBaseUrl: `${BASE_URL}/Assets/fonts`,
    });
  }

  public render(): TVNode<HTMLDivElement> {
    return (
      <div ref={this.gamepadUiViewRef} style="width: 100%; height: 100%;">
        <div ref={this.probeRef} style="width: 100%; height: 100%;" />
      </div>
    );
  }
}
