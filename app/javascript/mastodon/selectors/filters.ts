import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from 'mastodon/store';
import { toServerSideType } from 'mastodon/utils/filters';

// TODO: move to `app/javascript/mastodon/models` and use more globally
type Filter = Immutable.Record<{
  id: string;
  title: string;
  context: string;
  filter_action: string;
  keywords: unknown[];
  expires_at: Date | null;
}>;

// TODO: move to `app/javascript/mastodon/models` and use more globally
type FilterResult = Immutable.Record<{
  filter: string;
}>;

export const getFilters = createSelector(
  [
    (state: RootState) => state.filters as Immutable.Map<string, Filter>,
    (_, { contextType }: { contextType: string }) => contextType,
  ],
  (filters, contextType) => {
    if (!contextType) {
      return null;
    }

    const now = new Date();
    const serverSideType = toServerSideType(contextType);

    return filters.filter((filter) => {
      const expiration = filter.get('expires_at');
      return (
        filter.get('context').includes(serverSideType) &&
        (expiration === null || expiration > now)
      );
    });
  },
);

export const getStatusHidden = (
  state: RootState,
  { id, contextType }: { id: string; contextType: string },
) => {
  const filters = getFilters(state, { contextType });
  if (filters === null) return false;

  const filtered = state.statuses.getIn([id, 'filtered']) as
    | Immutable.List<FilterResult>
    | undefined;
  return filtered?.some(
    (result) =>
      filters.getIn([result.get('filter'), 'filter_action']) === 'hide',
  );
};
