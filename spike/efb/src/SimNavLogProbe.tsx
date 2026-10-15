import {
  App,
  AppBootMode,
  AppInstallProps,
  AppSuspendMode,
  AppView,
  AppViewProps,
  Efb,
  RequiredProps,
  TVNode,
} from "@efb/efb-api";
import { FSComponent, VNode } from "@microsoft/msfs-sdk";
import { ProbePage } from "./ProbePage";

declare const BASE_URL: string;

class ProbeView extends AppView<RequiredProps<AppViewProps, "bus">> {
  protected defaultView = "ProbePage";

  protected registerViews(): void {
    this.appViewService.registerPage("ProbePage", () => (
      <ProbePage appViewService={this.appViewService} />
    ));
  }

  public render(): VNode {
    return <div class="simnavlog-probe">{super.render()}</div>;
  }
}

class SimNavLogProbe extends App {
  public get name(): string {
    return "SimNavLog probe";
  }

  public get icon(): string {
    return `${BASE_URL}/Assets/app-icon.svg`;
  }

  public BootMode = AppBootMode.COLD;
  public SuspendMode = AppSuspendMode.SLEEP;

  public async install(_props: AppInstallProps): Promise<void> {
    // No stylesheet: the probe styles itself inline, so what it measures is
    // the engine and not a stylesheet's prefixing by the SDK's build.
  }

  // Every aircraft: a nav log is not tied to one.
  public get compatibleAircraftModels(): string[] | undefined {
    return undefined;
  }

  public render(): TVNode<ProbeView> {
    return <ProbeView bus={this.bus} />;
  }
}

Efb.use(SimNavLogProbe);
