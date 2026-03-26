import React from 'react';
import { cn } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/atoms/Avatar';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Typography } from '@/shared/ui/atoms/Typography';
import { formatRelativeTime } from '@/shared/lib/utils';

/**
 * ListItem Molecule - For lists (jobs, users, chats, notifications)
 */

export const ListItem = React.forwardRef(({
  avatar,
  title,
  subtitle,
  badge,
  time,
  onClick,
  rightAction,
  unread = false,
  active = false,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
        'hover:bg-slate-800/50',
        active && 'bg-slate-800 border border-slate-700',
        className
      )}
      {...props}
    >
      {avatar && (
        <Avatar src={avatar.src} name={avatar.name} size="md" online={avatar.online} />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Typography.H4 className="text-base truncate">
            {title}
          </Typography.H4>
          {badge && (
            <Badge variant={badge.variant} size="sm">{badge.text}</Badge>
          )}
        </div>
        {subtitle && (
          <Typography.Small muted className="truncate block mt-0.5">
            {subtitle}
          </Typography.Small>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        {time && (
          <Typography.Small muted>{formatRelativeTime(time)}</Typography.Small>
        )}
        {unread && (
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        )}
        {rightAction}
      </div>
    </div>
  );
});

ListItem.displayName = 'ListItem';
