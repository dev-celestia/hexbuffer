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
  Input,
} from '@celestia-project/ui';
import { formatPayloadValues, getResultUrl } from '../lib/utils';
import { INTRUDER_STATUS_FILTERS } from '../constants';
import {
  TrashIcon,
  MagnifyingGlassIcon,
  XIcon,
  CaretDownIcon,
  ArrowsOutSimpleIcon,
  ArrowsInSimpleIcon,
  FunnelSimpleIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useResultsPanel } from './hooks/use-results-panel';

export function IntruderResultsPanel() {
  const {
    isRunning,
    selectedResult,
    handleSelectResult,
    isFullWidthResults,
    toggleFullWidthResults,
    localSearch,
    filterStatusCodes,
    filterOnlyGrepMatch,
    filterOnlyErrors,
    hasActiveFilters,
    statusCounts,
    grepMatchCount,
    isGrepMatchConfigured,
    filteredResults,
    resultsCount,
    handleSearchChange,
    handleClearSearch,
    toggleFilterStatusCode,
    clearFilterStatusCodes,
    setFilterOnlyGrepMatch,
    setFilterOnlyErrors,
    clearAllFilters,
    clearResults,
    getStatusStyle,
  } = useResultsPanel();

  const hasStatusFilters = filterStatusCodes.length > 0;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0 overflow-hidden",

        // Sizing & Spacing
        "h-full",

        // Backgrounds & Borders
        "rounded-md border border-border bg-background"
      )}
    >
      {/* Header toolbar */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0 select-none overflow-x-auto overflow-y-hidden",

          // Sizing & Spacing
          "px-3 py-1.5 gap-2",

          // Backgrounds & Borders
          "border-b border-border bg-muted/40"
        )}
      >
        {/* Left side: Count and Search input */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center shrink-0",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
            )}
          >
            Results ({filteredResults.length}
            {filteredResults.length !== resultsCount ? `/${resultsCount}` : ''})
          </span>

          {/* Quick Search */}
          <div
            className={cn(
              // Layout & Positioning
              "relative flex items-center"
            )}
          >
            <MagnifyingGlassIcon
              className={cn(
                // Layout & Positioning
                "absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none",

                // Sizing & Spacing
                "size-3.5",

                // Typography
                "text-muted-foreground"
              )}
            />
            <Input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search status, payload, URL…"
              className={cn(
                // Sizing & Spacing
                "h-7 w-44 pl-7 pr-7 text-xs",

                // Backgrounds & Borders
                "bg-background border-input",

                // Interactive & States
                "focus:w-56 transition-all duration-150"
              )}
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className={cn(
                  // Layout & Positioning
                  "absolute right-2 top-1/2 -translate-y-1/2",

                  // Typography
                  "text-muted-foreground",

                  // Interactive & States
                  "hover:text-foreground"
                )}
              >
                <XIcon
                  className={cn(
                    // Sizing & Spacing
                    "size-3"
                  )}
                />
              </button>
            )}
          </div>
        </div>

        {/* Right side: Filters, Full-width Toggle, Clear */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center shrink-0",

            // Sizing & Spacing
            "gap-1.5"
          )}
        >
          {/* Status Dropdown Filter */}
          <ButtonGroup>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    data-state={hasStatusFilters ? 'on' : 'off'}
                    className={cn(
                      // Typography
                      "text-xs",

                      // Interactive & States
                      hasStatusFilters && "text-primary font-medium"
                    )}
                  >
                    <FunnelSimpleIcon
                      className={cn(
                        // Sizing & Spacing
                        "size-3.5 mr-1"
                      )}
                    />
                    <span>Status{hasStatusFilters ? ` (${filterStatusCodes.length})` : ''}</span>
                    <CaretDownIcon
                      className={cn(
                        // Sizing & Spacing
                        "size-3 ml-0.5"
                      )}
                    />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {INTRUDER_STATUS_FILTERS.map((status) => {
                    const count = statusCounts[status.label] ?? 0;
                    return (
                      <DropdownMenuCheckboxItem
                        key={status.label}
                        checked={filterStatusCodes.includes(status.label)}
                        onCheckedChange={() => toggleFilterStatusCode(status.label)}
                      >
                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex items-center justify-between",

                            // Sizing & Spacing
                            "w-full gap-4"
                          )}
                        >
                          <span
                            className={cn(
                              // Typography
                              "font-mono font-medium"
                            )}
                          >
                            {status.label}
                          </span>
                          <span
                            className={cn(
                              // Typography
                              "text-xs text-muted-foreground"
                            )}
                          >
                            {count > 0 ? `(${count})` : ''}
                          </span>
                        </div>
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuGroup>
                {hasStatusFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={clearFilterStatusCodes}>
                      Clear status filter
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Grep Match Filter (if grep match configured or matches exist) */}
            {(isGrepMatchConfigured || grepMatchCount > 0) && (
              <Button
                variant="outline"
                size="sm"
                data-state={filterOnlyGrepMatch ? 'on' : 'off'}
                onClick={() => setFilterOnlyGrepMatch(!filterOnlyGrepMatch)}
                className={cn(
                  // Typography
                  "text-xs",

                  // Interactive & States
                  filterOnlyGrepMatch && "text-emerald-500 font-medium"
                )}
                title="Show only grep keyword match results"
              >
                <CheckCircleIcon
                  className={cn(
                    // Sizing & Spacing
                    "size-3.5 mr-1",

                    // Typography
                    filterOnlyGrepMatch ? "text-emerald-500" : "text-muted-foreground"
                  )}
                />
                <span>Match{grepMatchCount > 0 ? ` (${grepMatchCount})` : ''}</span>
              </Button>
            )}

            {/* Errors Only Quick Toggle */}
            {statusCounts.errors > 0 && (
              <Button
                variant="outline"
                size="sm"
                data-state={filterOnlyErrors ? 'on' : 'off'}
                onClick={() => setFilterOnlyErrors(!filterOnlyErrors)}
                className={cn(
                  // Typography
                  "text-xs",

                  // Interactive & States
                  filterOnlyErrors && "text-destructive font-medium"
                )}
                title="Show only failed / error requests"
              >
                <WarningCircleIcon
                  className={cn(
                    // Sizing & Spacing
                    "size-3.5 mr-1",

                    // Typography
                    filterOnlyErrors ? "text-destructive" : "text-muted-foreground"
                  )}
                />
                <span>Errors ({statusCounts.errors})</span>
              </Button>
            )}
          </ButtonGroup>

          {/* Reset all filters button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className={cn(
                // Sizing & Spacing
                "h-7 px-2",

                // Typography
                "text-xs text-muted-foreground",

                // Interactive & States
                "hover:text-foreground"
              )}
              title="Reset all active filters"
            >
              <XIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3 mr-1"
                )}
              />
              Reset
            </Button>
          )}

          {/* Layout Toggle: Wider / Full-width Layout */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullWidthResults}
            data-state={isFullWidthResults ? 'on' : 'off'}
            className={cn(
              // Sizing & Spacing
              "h-7 px-2",

              // Typography
              "text-xs",

              // Interactive & States
              isFullWidthResults && "text-primary"
            )}
            title={isFullWidthResults ? "Restore 50/50 split layout" : "Expand results to full window width"}
          >
            {isFullWidthResults ? (
              <>
                <ArrowsInSimpleIcon
                  className={cn(
                    // Sizing & Spacing
                    "size-3.5 mr-1"
                  )}
                />
                <span>Split</span>
              </>
            ) : (
              <>
                <ArrowsOutSimpleIcon
                  className={cn(
                    // Sizing & Spacing
                    "size-3.5 mr-1"
                  )}
                />
                <span>Full Width</span>
              </>
            )}
          </Button>

          {/* Clear Results */}
          <Button
            variant="outline"
            size="sm"
            onClick={clearResults}
            disabled={resultsCount === 0}
            className={cn(
              // Sizing & Spacing
              "h-7 px-2",

              // Typography
              "text-xs"
            )}
            title="Clear all results"
          >
            <TrashIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5 mr-1"
              )}
            />
            Clear
          </Button>
        </div>
      </div>

      {/* Table Area */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-auto"
        )}
      >
        <table
          className={cn(
            // Sizing & Spacing
            "w-full",

            // Typography
            "text-[12px] border-collapse"
          )}
        >
          <thead
            className={cn(
              // Layout & Positioning
              "sticky top-0 z-10 select-none",

              // Backgrounds & Borders
              "border-b border-border bg-muted/50"
            )}
          >
            <tr>
              <th
                className={cn(
                  // Sizing & Spacing
                  "px-3 py-2 w-12",

                  // Typography
                  "text-left font-medium text-muted-foreground"
                )}
              >
                #
              </th>
              <th
                className={cn(
                  // Sizing & Spacing
                  "px-3 py-2 w-1/4",

                  // Typography
                  "text-left font-medium text-muted-foreground"
                )}
              >
                Payload
              </th>
              <th
                className={cn(
                  // Sizing & Spacing
                  "px-3 py-2 w-1/3",

                  // Typography
                  "text-left font-medium text-muted-foreground"
                )}
              >
                URL
              </th>
              <th
                className={cn(
                  // Sizing & Spacing
                  "px-3 py-2 w-20",

                  // Typography
                  "text-left font-medium text-muted-foreground"
                )}
              >
                Status
              </th>
              <th
                className={cn(
                  // Sizing & Spacing
                  "px-3 py-2 w-20",

                  // Typography
                  "text-right font-medium text-muted-foreground"
                )}
              >
                Length
              </th>
              <th
                className={cn(
                  // Sizing & Spacing
                  "px-3 py-2 w-20",

                  // Typography
                  "text-right font-medium text-muted-foreground"
                )}
              >
                Time
              </th>
              {(isGrepMatchConfigured || grepMatchCount > 0) && (
                <th
                  className={cn(
                    // Sizing & Spacing
                    "px-3 py-2 w-16",

                    // Typography
                    "text-center font-medium text-muted-foreground"
                  )}
                >
                  Match
                </th>
              )}
            </tr>
          </thead>
          <tbody
            className={cn(
              // Typography
              "font-mono",

              // Backgrounds & Borders
              "divide-y divide-border/40"
            )}
          >
            {filteredResults.map((result, index) => {
              const isSelected = selectedResult?.id === result.id;
              const hasError = Boolean(result.error);
              const statusClass = getStatusStyle(result);

              return (
                <tr
                  key={result.id}
                  className={cn(
                    // Interactive & States
                    "cursor-pointer transition-colors hover:bg-muted/30",
                    isSelected &&
                      "bg-primary/10 hover:bg-primary/15 dark:bg-primary/15 dark:hover:bg-primary/20 text-foreground font-medium",
                    hasError && !isSelected &&
                      "bg-destructive/5 text-destructive hover:bg-destructive/10"
                  )}
                  onClick={() => handleSelectResult(result)}
                >
                  {/* Row Number */}
                  <td
                    className={cn(
                      // Layout & Positioning
                      "select-none",

                      // Sizing & Spacing
                      "px-3 py-1.5",

                      // Typography
                      "text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </td>

                  {/* Payload values */}
                  <td
                    className={cn(
                      // Layout & Positioning
                      "max-w-0 truncate",

                      // Sizing & Spacing
                      "px-3 py-1.5",

                      // Typography
                      "font-semibold"
                    )}
                    title={formatPayloadValues(result.payload_values)}
                  >
                    {formatPayloadValues(result.payload_values)}
                  </td>

                  {/* Result URL */}
                  <td
                    className={cn(
                      // Layout & Positioning
                      "max-w-0 truncate",

                      // Sizing & Spacing
                      "px-3 py-1.5",

                      // Typography
                      "text-muted-foreground"
                    )}
                    title={getResultUrl(result)}
                  >
                    {getResultUrl(result) || '-'}
                  </td>

                  {/* Status Badge */}
                  <td
                    className={cn(
                      // Sizing & Spacing
                      "px-3 py-1.5"
                    )}
                  >
                    {result.status ? (
                      <span
                        className={cn(
                          // Layout & Positioning
                          "inline-flex items-center",

                          // Sizing & Spacing
                          "px-1.5 py-0.5",

                          // Typography
                          "text-[10px] font-semibold",

                          // Backgrounds & Borders
                          "rounded border",
                          statusClass
                        )}
                      >
                        {result.status}
                      </span>
                    ) : hasError ? (
                      <span
                        className={cn(
                          // Layout & Positioning
                          "inline-flex items-center",

                          // Sizing & Spacing
                          "px-1.5 py-0.5",

                          // Typography
                          "text-[10px] font-semibold text-destructive",

                          // Backgrounds & Borders
                          "rounded border bg-destructive/15 border-destructive/20"
                        )}
                      >
                        Error
                      </span>
                    ) : (
                      <span
                        className={cn(
                          // Typography
                          "text-muted-foreground"
                        )}
                      >
                        -
                      </span>
                    )}
                  </td>

                  {/* Response Length */}
                  <td
                    className={cn(
                      // Sizing & Spacing
                      "px-3 py-1.5",

                      // Typography
                      "text-right text-muted-foreground"
                    )}
                  >
                    {result.response_length != null ? result.response_length.toLocaleString() : '-'}
                  </td>

                  {/* Response Time */}
                  <td
                    className={cn(
                      // Sizing & Spacing
                      "px-3 py-1.5",

                      // Typography
                      "text-right text-muted-foreground"
                    )}
                  >
                    {result.response_time_ms != null ? `${result.response_time_ms}ms` : '-'}
                  </td>

                  {/* Match Column */}
                  {(isGrepMatchConfigured || grepMatchCount > 0) && (
                    <td
                      className={cn(
                        // Sizing & Spacing
                        "px-3 py-1.5",

                        // Typography
                        "text-center"
                      )}
                    >
                      {result.grep_match ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            // Sizing & Spacing
                            "px-1.5 py-0.2",

                            // Typography
                            "text-[10px] font-semibold text-emerald-600 dark:text-emerald-400",

                            // Backgrounds & Borders
                            "border-emerald-500/30 bg-emerald-500/10"
                          )}
                        >
                          Match
                        </Badge>
                      ) : (
                        <span
                          className={cn(
                            // Typography
                            "text-muted-foreground/50"
                          )}
                        >
                          -
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {filteredResults.length === 0 && (
              <tr>
                <td
                  colSpan={isGrepMatchConfigured || grepMatchCount > 0 ? 7 : 6}
                  className={cn(
                    // Sizing & Spacing
                    "px-3 py-12",

                    // Typography
                    "text-center font-sans text-muted-foreground"
                  )}
                >
                  {isRunning
                    ? 'Running attack...'
                    : hasActiveFilters
                      ? 'No results match the current filter criteria.'
                      : 'No results available.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const InvokerResultsPanel = IntruderResultsPanel;

