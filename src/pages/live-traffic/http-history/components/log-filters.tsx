import {
  Badge,
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@celestia-project/ui';
import {
  CaretDownIcon,
  MagnifyingGlassIcon,
  PauseIcon,
  PlayIcon,
  TargetIcon,
  XIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { METHOD_FILTERS, STATUS_FILTERS } from './log-table/utils';
import { FilterChips } from './filter-chips';
import { SessionSelector } from './session';
import { useLogFilters, type UseLogFiltersProps } from '../hooks/use-log-filters';
import { WindowHeaderSlot } from '@/providers/window-provider';

export type LogFiltersProps = UseLogFiltersProps;

export function LogFilters(props: LogFiltersProps) {
  const {
    filter,
    localSearch,
    handleSearchChange,
    handleClearSearch,
    handleToggleMethod,
    handleClearMethods,
    handleToggleStatus,
    handleClearStatus,
    isStreamManuallyPaused,
    handleToggleStreamPause,
    openTargetSelector,
    blacklistRules,
    removeBlacklistRule,
    highlightedHosts,
    removeHighlight,
  } = useLogFilters(props);

  const hasMethods = filter.methods.size > 0;
  const hasStatusCodes = filter.statusCodes.size > 0;

  return (
    <div
      className={cn(
        // Sizing & Spacing
        "p-2 px-2"
      )}
    >
      <WindowHeaderSlot>
        <ButtonGroup>
          <Button
            size="xs"
            variant="ghost"
            onClick={handleToggleStreamPause}
          >
            {isStreamManuallyPaused ? (
              <>
                <PlayIcon className='size-3' />
                <p className='mt-[1px]'>Resume</p>
              </>
            ) : (
              <>
                <PauseIcon className='size-3' />
                <p className='mt-[1px]'>Pause</p>
              </>
            )}
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={openTargetSelector}
            className={"flex items-center"}
          >
            <TargetIcon className='size-3' />
            <p className='mt-[1px]'>Target</p>
          </Button>
        </ButtonGroup>
      </WindowHeaderSlot>

      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",

          // Sizing & Spacing
          "w-full gap-2"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <SessionSelector />
          <InputGroup
            className={cn(
              // Sizing & Spacing
              "w-48",

              // Interactive & States
              "transition-all duration-150 focus-within:w-64"
            )}
          >
            <InputGroupAddon align="inline-start">
              <MagnifyingGlassIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5",

                  // Typography
                  "text-muted-foreground"
                )}
              />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search URL, host, method, body…"
              className={cn(
                // Sizing & Spacing
                "h-7 text-xs"
              )}
            />
            {localSearch && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  variant="ghost"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <XIcon
                    className={cn(
                      // Sizing & Spacing
                      "size-3"
                    )}
                  />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <ButtonGroup>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    data-state={hasMethods ? 'on' : 'off'}
                    className={cn(
                      // Interactive & States
                      hasMethods && "text-primary"
                    )}
                  >
                    <span>Method{hasMethods ? ` (${filter.methods.size})` : ''}</span>
                    <CaretDownIcon />
                  </Button>
                }
              />
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Filter by Method</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {METHOD_FILTERS.map((method) => (
                    <DropdownMenuCheckboxItem
                      key={method}
                      checked={filter.methods.has(method)}
                      onCheckedChange={(checked) => handleToggleMethod(method, !!checked)}
                    >
                      {method}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
                {hasMethods && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleClearMethods}>
                      Clear methods
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    data-state={hasStatusCodes ? 'on' : 'off'}
                    className={cn(
                      // Interactive & States
                      hasStatusCodes && "text-primary"
                    )}
                  >
                    <span>Status{hasStatusCodes ? ` (${filter.statusCodes.size})` : ''}</span>
                    <CaretDownIcon />
                  </Button>
                }
              />
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {STATUS_FILTERS.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status.label}
                      checked={filter.statusCodes.has(status.label)}
                      onCheckedChange={(checked) => handleToggleStatus(status.label, !!checked)}
                    >
                      {status.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
                {hasStatusCodes && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleClearStatus}>
                      Clear status
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </div>
      </div>

      <FilterChips
        blacklistRules={blacklistRules}
        onRemoveBlacklistRule={removeBlacklistRule}
        highlightedHosts={highlightedHosts}
        onRemoveHighlight={removeHighlight}
      />
    </div>
  );
}
