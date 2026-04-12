import { Breadcrumbs, Link, Typography } from '@mui/material';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function AppBreadcrumbs({ items }: AppBreadcrumbsProps): JSX.Element {
  return (
    <Breadcrumbs sx={{ mb: 2 }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        if (isLast) {
          // Last item: non-clickable Typography
          return (
            <Typography key={index} color="text.primary">
              {item.label}
            </Typography>
          );
        }
        
        // Clickable link
        return (
          <Link
            key={index}
            component="button"
            variant="inherit"
            underline="hover"
            onClick={item.onClick}
            sx={{ cursor: 'pointer' }}
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
