import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@celestia-project/ui';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CopyIcon,
  GlobeIcon,
  PaperPlaneTiltIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { deleteWebSocket, getWebSocketDetail } from '../../api';
import { sendToCollection, sendRawToRepeater } from '@/triggers/repeater';
import { CollectionPickerSubmenu } from '@/triggers/repeater/collection-picker-submenu';

interface WebSocketContextMenuProps {
  connectionId: string;
  connectionUrl: string;
  connectionHost: string;
  connectionPath: string;
  children: React.ReactNode;
  onDelete?: (id: string) => void;
}

export function WebSocketContextMenu({
  connectionId,
  connectionUrl,
  connectionHost,
  connectionPath,
  children,
  onDelete,
}: WebSocketContextMenuProps) {
  const navigate = useNavigate();

  const handleCopyUrl = React.useCallback(() => {
    if (connectionUrl) {
      navigator.clipboard.writeText(connectionUrl);
      toast.success('WebSocket URL copied');
    }
  }, [connectionUrl]);

  const handleCopyHost = React.useCallback(() => {
    if (connectionHost) {
      navigator.clipboard.writeText(connectionHost);
      toast.success('Host copied');
    }
  }, [connectionHost]);

  const handleOpenInRepeater = React.useCallback(async () => {
    try {
      const detail = await getWebSocketDetail(connectionId);
      const headers = detail.connection.handshake_request_headers || {};
      const url = connectionUrl || detail.connection.url || '';

      await sendRawToRepeater({
        url,
        headers,
        name: `WS ${url}`,
      });

      navigate('/repeater');
    } catch (error) {
      console.error('Failed to open WebSocket in Repeater:', error);
      toast.error('Failed to open WebSocket in Repeater');
    }
  }, [connectionId, connectionUrl, navigate]);

  const handleSendToCollection = React.useCallback(async (stashId: string) => {
    try {
      const detail = await getWebSocketDetail(connectionId);
      const headers = detail.connection.handshake_request_headers || {};
      const url = connectionUrl || detail.connection.url || '';

      await sendToCollection({
        stashId,
        stashName: '',
        endpointData: {
          name: `WS ${connectionPath || url}`,
          method: 'GET',
          url,
          headers,
          body: null,
        },
      });
    } catch (error) {
      console.error('Failed to send WebSocket to collection:', error);
      toast.error('Failed to send WebSocket to collection');
    }
  }, [connectionId, connectionPath, connectionUrl]);

  const handleDelete = React.useCallback(async () => {
    try {
      await deleteWebSocket(connectionId);
      onDelete?.(connectionId);
      toast.success('Connection deleted');
    } catch (error) {
      console.error('Failed to delete WebSocket connection:', error);
      toast.error('Failed to delete WebSocket connection');
    }
  }, [connectionId, onDelete]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={handleCopyUrl} className="text-xs">
          <CopyIcon className="mr-2 size-3.5 text-muted-foreground" />
          Copy URL
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyHost} className="text-xs">
          <GlobeIcon className="mr-2 size-3.5 text-muted-foreground" />
          Copy Host
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleOpenInRepeater} className="text-xs">
          <PaperPlaneTiltIcon className="mr-2 size-3.5 text-primary" />
          Send to Repeater
        </ContextMenuItem>

        <CollectionPickerSubmenu
          variant="context"
          onSelect={(stashId) => {
            void handleSendToCollection(stashId);
          }}
        />

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={handleDelete}
          variant="destructive"
          className="text-xs"
        >
          <TrashIcon className="mr-2 size-3.5" />
          Delete Connection
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
