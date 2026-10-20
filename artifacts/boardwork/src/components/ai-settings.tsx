import { useRef, useState, useSyncExternalStore } from "react";
import { KeyRound, ExternalLink } from "lucide-react";
import {
  subscribeAIState,
  getAIState,
  openAISettings,
  setAIKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const useAIState = () =>
  useSyncExternalStore(subscribeAIState, getAIState, getAIState);

export function AIUsageControl() {
  const state = useAIState();
  const total = state.inputTokens + state.outputTokens;
  return (
    <button
      type="button"
      onClick={() => openAISettings()}
      data-testid="ai-usage"
      className="min-h-8 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={
        state.hasKey
          ? `AI settings. ${total.toLocaleString()} reported tokens this visit`
          : "Add your OpenAI API key"
      }
    >
      {state.hasKey
        ? `Your key · ${compact.format(total)} tokens this visit${state.unreportedRequests ? "*" : ""}`
        : "Use your own OpenAI key"}
    </button>
  );
}

export function AISettings() {
  const state = useAIState();
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const changeOpen = (open: boolean) => {
    if (input.current) input.current.value = "";
    setError("");
    openAISettings(open);
  };
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => changeOpen(true)}
        aria-label="AI settings"
        data-testid="button-ai-settings"
      >
        <KeyRound aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">AI key</span>
      </Button>
      <Dialog open={state.settingsOpen} onOpenChange={changeOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your AI key</DialogTitle>
            <DialogDescription>
              Use your own OpenAI account to create boards. Editing and
              presenting saved boards do not need a key.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              try {
                const value = input.current?.value.trim() ?? "";
                if (!value) {
                  setError("Paste your OpenAI API key first.");
                  return;
                }
                setAIKey(value);
                void queryClient.invalidateQueries({
                  predicate: (query) =>
                    String(query.queryKey[0]).includes("/curriculum"),
                });
                changeOpen(false);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Check your API key.",
                );
              }
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="openai-key">OpenAI API key</Label>
              <Input
                ref={input}
                id="openai-key"
                name="openai-api-key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder={state.hasKey ? "Paste a replacement key" : "sk-…"}
                maxLength={503}
                aria-invalid={Boolean(error)}
                aria-describedby="key-privacy key-error"
              />
              <p
                id="key-privacy"
                className="text-xs leading-relaxed text-muted-foreground"
              >
                Kept in memory until you refresh or close this page. Your key
                passes through this server to OpenAI for each AI request; it is
                never saved to the database or browser storage.
              </p>
              {error ? (
                <p
                  id="key-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}
              {state.hasKey ? (
                <p className="text-xs text-muted-foreground" role="status">
                  A key is added for this visit. OpenAI checks it when you make
                  a request.
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-sm text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Get an API key{" "}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
              <div className="flex items-center gap-2">
                {state.hasKey ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setAIKey("");
                      changeOpen(false);
                      void queryClient.invalidateQueries({
                        predicate: (query) =>
                          String(query.queryKey[0]).includes("/curriculum"),
                      });
                    }}
                  >
                    Remove key
                  </Button>
                ) : null}
                <Button type="submit">
                  {state.hasKey ? "Replace key" : "Use key"}
                </Button>
              </div>
            </div>
          </form>
          <Separator />
          <section
            className="flex flex-col gap-3"
            aria-label="Usage this visit"
          >
            <h3 className="text-sm font-medium">Usage this visit</h3>
            <dl className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">AI requests</dt>
                <dd className="mt-1 tabular-nums">
                  {state.requests.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Input tokens</dt>
                <dd className="mt-1 tabular-nums">
                  {state.inputTokens.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Output tokens</dt>
                <dd className="mt-1 tabular-nums">
                  {state.outputTokens.toLocaleString()}
                </dd>
              </div>
            </dl>
            <p className="text-xs leading-relaxed text-muted-foreground">
              OpenAI-reported usage for this key during this visit, including
              repair attempts and curriculum tools. Resets on refresh or key
              replacement. This is not your account balance or an exact bill;
              search tools may add charges.
            </p>
            {state.unreportedRequests ? (
              <p className="text-xs text-muted-foreground" role="status">
                * {state.unreportedRequests} request(s) returned no usage data.
                Tokens or charges from those requests may be missing.
              </p>
            ) : null}
            <a
              href="https://platform.openai.com/usage"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-8 items-center gap-1.5 self-start rounded-sm text-xs text-muted-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View OpenAI usage{" "}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </section>
        </DialogContent>
      </Dialog>
    </>
  );
}
