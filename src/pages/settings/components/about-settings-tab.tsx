import { Button } from '@celestia-project/ui';
import { ArrowSquareOutIcon } from '@phosphor-icons/react';

import { PROFILE_LINKS } from '../constants';
import { SettingsGroup, SettingsRow } from './settings-group';

export function AboutSettingsTab() {
  return (
    <>
      <SettingsGroup label="About" description="hexbuffer is a focused desktop app for inspecting requests, repeating traffic, and shaping better workflows.">
        <SettingsRow label="Developer" description="Arham — Software Developer" />
        <SettingsRow label="Links">
          <div className="flex items-center gap-2">
            {PROFILE_LINKS.map(({ label, href, Icon }) => (
              <Button key={href} size="xs" variant="outline" asChild>
                <a href={href} target="_blank" rel="noreferrer">
                  <Icon className="size-3.5" />
                  {label}
                  <ArrowSquareOutIcon className="size-3" />
                </a>
              </Button>
            ))}
          </div>
        </SettingsRow>
      </SettingsGroup>
    </>
  );
}
