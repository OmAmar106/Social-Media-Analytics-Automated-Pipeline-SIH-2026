import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  Search,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  useAppState,
  type PlatformFilter,
  type TimeRange,
} from "@/lib/app-state";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CredentialState = {
  telegramApiId: string;
  telegramApiHash: string;
  telegramPhone: string;

  instagramAppId: string;
  instagramAppSecret: string;
  instagramAccessToken: string;

  facebookAppId: string;
  facebookAppSecret: string;
  facebookAccessToken: string;

  youtubeApiKey: string;

  xBearerToken: string;

  redditClientId: string;
  redditClientSecret: string;
  redditUserAgent: string;
};

const emptyCredentials: CredentialState = {
  telegramApiId: "",
  telegramApiHash: "",
  telegramPhone: "",

  instagramAppId: "",
  instagramAppSecret: "",
  instagramAccessToken: "",

  facebookAppId: "",
  facebookAppSecret: "",
  facebookAccessToken: "",

  youtubeApiKey: "",

  xBearerToken: "",

  redditClientId: "",
  redditClientSecret: "",
  redditUserAgent: "",
};

export function TopBar() {
  const navigate = useNavigate();

  const {
    platform,
    setPlatform,
    range,
    setRange,
    workspace,
  } = useAppState();

  const [commandOpen, setCommandOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [settingsSection, setSettingsSection] =
    useState<
      "settings" | "workspace" | "credentials"
    >("settings");

  const [workspaceName, setWorkspaceName] =
    useState(workspace);

  const [displayWorkspace, setDisplayWorkspace] =
    useState(workspace);

  const [credentials, setCredentials] =
    useState<CredentialState>(emptyCredentials);

  const [signedIn, setSignedIn] = useState(true);

  /*
   * Load browser-only settings.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedWorkspace =
      window.localStorage.getItem(
        "signal_workspace",
      );

    const savedCredentials =
      window.localStorage.getItem(
        "signal_credentials",
      );

    const savedSignedIn =
      window.localStorage.getItem(
        "signal_signed_in",
      );

    if (savedWorkspace) {
      setWorkspaceName(savedWorkspace);
      setDisplayWorkspace(savedWorkspace);
    }

    if (savedCredentials) {
      try {
        const parsed = JSON.parse(
          savedCredentials,
        );

        setCredentials({
          ...emptyCredentials,
          ...parsed,
        });
      } catch {
        setCredentials(emptyCredentials);
      }
    }

    if (savedSignedIn === "false") {
      setSignedIn(false);
    }
  }, []);

  /*
   * Ctrl/Cmd + K.
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  const platformOptions: Array<{
    value: PlatformFilter;
    label: string;
  }> = [
    {
      value: "all",
      label: "All platforms",
    },
    {
      value: "x",
      label: "X",
    },
    {
      value: "youtube",
      label: "YouTube",
    },
    {
      value: "facebook",
      label: "Facebook",
    },
    {
      value: "telegram",
      label: "Telegram",
    },
    {
      value: "reddit",
      label: "Reddit",
    },
    {
      value: "instagram",
      label: "Instagram",
    },
  ];

  const rangeOptions: Array<{
    value: TimeRange;
    label: string;
  }> = [
    {
      value: "24h",
      label: "Last 24 hours",
    },
    {
      value: "7d",
      label: "Last 7 days",
    },
    {
      value: "30d",
      label: "Last 30 days",
    },
    {
      value: "90d",
      label: "Last 90 days",
    },
  ];

  const currentPlatform =
    platformOptions.find(
      (item) => item.value === platform,
    ) ?? platformOptions[0];

  const currentRange =
    rangeOptions.find(
      (item) => item.value === range,
    ) ?? rangeOptions[0];

  const searchItems = useMemo(
    () => [
      {
        type: "Dashboard",
        label: "Dashboard",
        path: "/",
      },
      {
        type: "Sentiment",
        label: "Sentiment",
        path: "/sentiment",
      },
      {
        type: "Platforms",
        label: "Platforms",
        path: "/platforms",
      },
      {
        type: "Trends",
        label: "Trends",
        path: "/trends",
      },
      {
        type: "Keywords",
        label: "Viral Keywords",
        path: "/keywords",
      },
      {
        type: "Content",
        label: "Content Intelligence",
        path: "/content",
      },
      {
        type: "Explorer",
        label: "Data Explorer",
        path: "/explorer",
      },
      {
        type: "Audience",
        label: "Audience & Demographics",
        path: "/audience",
      },
      {
        type: "Propagation",
        label: "Trend Propagation",
        path: "/propagation",
      },
      {
        type: "Chatbot",
        label: "AI Chatbot",
        path: "/chatbot",
      },
    ],
    [],
  );

  const openSettings = (
    section:
      | "settings"
      | "workspace"
      | "credentials",
  ) => {
    setSettingsSection(section);
    setSettingsOpen(true);
  };

  const updateCredential = (
    field: keyof CredentialState,
    value: string,
  ) => {
    setCredentials((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveCredentials = () => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      "signal_credentials",
      JSON.stringify(credentials),
    );

    setSettingsOpen(false);
  };

  const saveWorkspace = () => {
    if (typeof window === "undefined") return;

    const cleanedName =
      workspaceName.trim();

    if (!cleanedName) return;

    window.localStorage.setItem(
      "signal_workspace",
      cleanedName,
    );

    setWorkspaceName(cleanedName);
    setDisplayWorkspace(cleanedName);

    setSettingsOpen(false);
  };

  /*
   * Prototype sign-out.
   *
   * This now creates a visible signed-out state
   * instead of simply navigating to the same dashboard.
   */
  const signOut = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "signal_signed_in",
        "false",
      );

      window.sessionStorage.clear();
    }

    setSignedIn(false);
    setSettingsOpen(false);
  };

  /*
   * Prototype sign-in again.
   */
  const signIn = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "signal_signed_in",
        "true",
      );
    }

    setSignedIn(true);
  };

  /*
   * Signed-out screen.
   */
  if (!signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-6">
            <div className="text-lg font-semibold">
              Social Media Analytics
            </div>

            <div className="mt-1 text-sm text-muted-foreground">
              You have been signed out.
            </div>
          </div>

          <Button
            className="w-full"
            onClick={signIn}
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">

          {/* Workspace */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {displayWorkspace}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Production
              </div>
            </div>
          </div>

          <div className="mx-1 hidden h-6 w-px bg-border md:block" />

          {/* Search */}
          <button
            type="button"
            onClick={() =>
              setCommandOpen(true)
            }
            className={cn(
              "hidden h-9 flex-1 items-center gap-2 rounded-md",
              "border bg-muted/30 px-3 text-left text-sm",
              "text-muted-foreground transition-colors",
              "hover:bg-muted/50 md:flex",
            )}
          >
            <Search className="size-4" />

            <span className="flex-1">
              Search trends, keywords, creators...
            </span>

            <kbd className="hidden rounded border bg-background px-1.5 py-0.5 text-[10px] sm:block">
              Ctrl K
            </kbd>
          </button>

          {/* Mobile search */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() =>
              setCommandOpen(true)
            }
            aria-label="Search"
          >
            <Search className="size-4" />
          </Button>

          <div className="flex-1 md:hidden" />

          {/* Time range */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden gap-2 text-xs sm:flex"
              >
                <SlidersHorizontal className="size-3.5" />
                {currentRange.label}
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                Time range
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {rangeOptions.map((item) => (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() =>
                    setRange(item.value)
                  }
                >
                  <span
                    className={cn(
                      item.value === range &&
                        "font-semibold",
                    )}
                  >
                    {item.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Platform */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden gap-2 text-xs lg:flex"
              >
                {currentPlatform.label}
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                Platform
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {platformOptions.map((item) => (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() =>
                    setPlatform(item.value)
                  }
                >
                  <span
                    className={cn(
                      item.value === platform &&
                        "font-semibold",
                    )}
                  >
                    {item.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Alerts */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Alerts"
              >
                <Bell className="size-4" />

                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-red-500" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-72"
            >
              <DropdownMenuLabel>
                Alerts
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="flex-col items-start gap-1">
                <span className="text-xs font-medium">
                  Monitoring is active
                </span>

                <span className="text-[11px] text-muted-foreground">
                  Your analytics pipeline is running.
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem className="flex-col items-start gap-1">
                <span className="text-xs font-medium">
                  Telegram data available
                </span>

                <span className="text-[11px] text-muted-foreground">
                  New Telegram posts are available for analysis.
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Settings"
            onClick={() =>
              openSettings("settings")
            }
          >
            <Settings className="size-4" />
          </Button>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 px-2"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  A
                </div>

                <span className="hidden text-xs font-medium sm:inline">
                  A. Reyes
                </span>

                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                Account
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-xs"
                onClick={() =>
                  openSettings("workspace")
                }
              >
                Workspace settings
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-xs"
                onClick={() =>
                  openSettings("credentials")
                }
              >
                API credentials
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-xs"
                onClick={() => {}}
              >
                Collector configuration
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-xs text-red-600 focus:text-red-600"
                onClick={signOut}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search */}
      <CommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
      >
        <CommandInput
          placeholder="Search pages..."
        />

        <CommandList>
          <CommandEmpty>
            No results found.
          </CommandEmpty>

          <CommandGroup heading="Navigate">
            {searchItems.map((item) => (
              <CommandItem
                key={item.path}
                value={`${item.type} ${item.label}`}
                onSelect={() => {
                  setCommandOpen(false);

                  navigate({
                    to: item.path,
                  });
                }}
              >
                <Search className="mr-2 size-4" />

                <span>{item.label}</span>

                <span className="ml-auto text-[10px] text-muted-foreground">
                  {item.type}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Settings */}
      <Dialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">

          <DialogHeader>
            <DialogTitle>
              {settingsSection === "settings" &&
                "Settings"}

              {settingsSection === "workspace" &&
                "Workspace Settings"}

              {settingsSection === "credentials" &&
                "API Credentials"}
            </DialogTitle>

            <DialogDescription>
              {settingsSection === "settings" &&
                "Manage your Social Media Analytics workspace."}

              {settingsSection === "workspace" &&
                "Configure the workspace name used by this prototype."}

              {settingsSection === "credentials" &&
                "Configure credentials for the supported social platforms."}
            </DialogDescription>
          </DialogHeader>

          {/* GENERAL SETTINGS */}
          {settingsSection === "settings" && (
            <div className="space-y-4">

              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium">
                  System status
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Backend connected
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium">
                  Current workspace
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  {displayWorkspace}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() =>
                  openSettings("workspace")
                }
              >
                Workspace settings
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  openSettings("credentials")
                }
              >
                API credentials
              </Button>
            </div>
          )}

          {/* WORKSPACE */}
          {settingsSection === "workspace" && (
            <div className="space-y-4">

              <div className="space-y-2">
                <label
                  htmlFor="workspace-name"
                  className="text-xs font-medium"
                >
                  Workspace name
                </label>

                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(event) =>
                    setWorkspaceName(
                      event.target.value,
                    )
                  }
                  placeholder="Enter workspace name"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setSettingsOpen(false)
                  }
                >
                  Cancel
                </Button>

                <Button
                  onClick={saveWorkspace}
                >
                  Save workspace
                </Button>
              </div>
            </div>
          )}

          {/* API CREDENTIALS */}
          {settingsSection === "credentials" && (
            <div className="space-y-6">

              {/* TELEGRAM */}
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <div className="text-sm font-semibold">
                    Telegram
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    Used by the Telethon collector.
                  </div>
                </div>

                <Input
                  placeholder="Telegram API ID"
                  value={credentials.telegramApiId}
                  onChange={(event) =>
                    updateCredential(
                      "telegramApiId",
                      event.target.value,
                    )
                  }
                />

                <Input
                  type="password"
                  placeholder="Telegram API Hash"
                  value={credentials.telegramApiHash}
                  onChange={(event) =>
                    updateCredential(
                      "telegramApiHash",
                      event.target.value,
                    )
                  }
                />

                <Input
                  placeholder="Telegram phone number"
                  value={credentials.telegramPhone}
                  onChange={(event) =>
                    updateCredential(
                      "telegramPhone",
                      event.target.value,
                    )
                  }
                />
              </div>

              {/* INSTAGRAM */}
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <div className="text-sm font-semibold">
                    Instagram
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    Professional Instagram account credentials.
                  </div>
                </div>

                <Input
                  placeholder="Instagram App ID"
                  value={credentials.instagramAppId}
                  onChange={(event) =>
                    updateCredential(
                      "instagramAppId",
                      event.target.value,
                    )
                  }
                />

                <Input
                  type="password"
                  placeholder="Instagram App Secret"
                  value={credentials.instagramAppSecret}
                  onChange={(event) =>
                    updateCredential(
                      "instagramAppSecret",
                      event.target.value,
                    )
                  }
                />

                <Input
                  type="password"
                  placeholder="Instagram Access Token"
                  value={credentials.instagramAccessToken}
                  onChange={(event) =>
                    updateCredential(
                      "instagramAccessToken",
                      event.target.value,
                    )
                  }
                />
              </div>

              {/* FACEBOOK */}
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <div className="text-sm font-semibold">
                    Facebook
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    Meta Graph API credentials.
                  </div>
                </div>

                <Input
                  placeholder="Facebook App ID"
                  value={credentials.facebookAppId}
                  onChange={(event) =>
                    updateCredential(
                      "facebookAppId",
                      event.target.value,
                    )
                  }
                />

                <Input
                  type="password"
                  placeholder="Facebook App Secret"
                  value={credentials.facebookAppSecret}
                  onChange={(event) =>
                    updateCredential(
                      "facebookAppSecret",
                      event.target.value,
                    )
                  }
                />

                <Input
                  type="password"
                  placeholder="Facebook Access Token"
                  value={credentials.facebookAccessToken}
                  onChange={(event) =>
                    updateCredential(
                      "facebookAccessToken",
                      event.target.value,
                    )
                  }
                />
              </div>

              {/* YOUTUBE */}
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <div className="text-sm font-semibold">
                    YouTube
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    YouTube Data API credential.
                  </div>
                </div>

                <Input
                  type="password"
                  placeholder="YouTube API Key"
                  value={credentials.youtubeApiKey}
                  onChange={(event) =>
                    updateCredential(
                      "youtubeApiKey",
                      event.target.value,
                    )
                  }
                />
              </div>

              {/* X */}
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <div className="text-sm font-semibold">
                    X / Twitter
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    Bearer token for X API integration.
                  </div>
                </div>

                <Input
                  type="password"
                  placeholder="X Bearer Token"
                  value={credentials.xBearerToken}
                  onChange={(event) =>
                    updateCredential(
                      "xBearerToken",
                      event.target.value,
                    )
                  }
                />
              </div>

              {/* REDDIT */}
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <div className="text-sm font-semibold">
                    Reddit
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    Reddit application credentials.
                  </div>
                </div>

                <Input
                  placeholder="Reddit Client ID"
                  value={credentials.redditClientId}
                  onChange={(event) =>
                    updateCredential(
                      "redditClientId",
                      event.target.value,
                    )
                  }
                />

                <Input
                  type="password"
                  placeholder="Reddit Client Secret"
                  value={credentials.redditClientSecret}
                  onChange={(event) =>
                    updateCredential(
                      "redditClientSecret",
                      event.target.value,
                    )
                  }
                />

                <Input
                  placeholder="Reddit User Agent"
                  value={credentials.redditUserAgent}
                  onChange={(event) =>
                    updateCredential(
                      "redditUserAgent",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="rounded-lg border p-3 text-[11px] text-muted-foreground">
                Prototype note: these values are currently
                stored in browser local storage. For production,
                credentials should be stored securely on the
                backend and never exposed to the browser.
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setSettingsOpen(false)
                  }
                >
                  Cancel
                </Button>

                <Button
                  onClick={saveCredentials}
                >
                  Save all credentials
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}