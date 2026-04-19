import React from 'react';
import { SearchableEntityType } from '@/types/search';
import AppsIcon from '@mui/icons-material/Apps';
import DomainIcon from '@mui/icons-material/Domain';
import BusinessIcon from '@mui/icons-material/Business';
import StoreIcon from '@mui/icons-material/Store';
import ComputerIcon from '@mui/icons-material/Computer';
import StorageIcon from '@mui/icons-material/Storage';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { SvgIconComponent } from '@mui/icons-material';

export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;

  const escapedQuery = escapeRegExp(query);
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              backgroundColor: '#ffd54f',
              fontWeight: 600,
              padding: '0 2px',
              borderRadius: '2px',
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function truncate(text: string | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

const typeToIcon: Record<SearchableEntityType, SvgIconComponent> = {
  application: AppsIcon,
  domain: DomainIcon,
  businessCapability: BusinessIcon,
  provider: StoreIcon,
  itComponent: ComputerIcon,
  dataObject: StorageIcon,
  interface: SwapHorizIcon,
};

export function getTypeIcon(type: SearchableEntityType): SvgIconComponent {
  return typeToIcon[type];
}

export const typeToRoute: Record<SearchableEntityType, string> = {
  application: '/applications',
  domain: '/domains',
  businessCapability: '/business-capabilities',
  provider: '/providers',
  itComponent: '/it-components',
  dataObject: '/data-objects',
  interface: '/interfaces',
};

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
