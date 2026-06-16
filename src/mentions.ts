import type { AdaptiveCard, MentionEntity, MentionTarget } from './types';

export interface MentionedText {
  text: string;
  entities: MentionEntity[];
}

// Add <at> mention above the message body and include the mention entities
export function prependMentionsToText(
  text: string,
  mentions: MentionTarget[],
  options: { escapeBody?: boolean } = {},
): MentionedText {
  const mentionText = mentions.map(buildMentionToken).join(' ');
  const body = options.escapeBody ? escapeXml(text) : text;

  return {
    text: `${mentionText}\n\n${body}`,
    entities: buildMentionEntities(mentions),
  };
}

// Prepend a TextBlock with mentions to the card body and include the mention entities
// Teams resolves <at> mentions for cards via msteams.entities
export function addMentionsToCard(card: AdaptiveCard, mentions: MentionTarget[]): AdaptiveCard {
  if (mentions.length === 0) {
    return card;
  }

  card.body.unshift({
    type: 'TextBlock',
    text: mentions.map(buildMentionToken).join(' '),
    wrap: true,
    spacing: 'None',
    isSubtle: true,
  });

  card.msteams = {
    entities: buildMentionEntities(mentions),
  };

  return card;
}

function buildMentionEntities(mentions: MentionTarget[]): MentionEntity[] {
  return mentions.map((mention) => {
    const text = buildMentionToken(mention);

    return {
      type: 'mention',
      text,
      mentioned: {
        id: mention.id,
        name: mention.name,
      },
    };
  });
}

// Teams renders <at>name</at> as a clickable mention when a matching entity is included
function buildMentionToken(mention: MentionTarget): string {
  return `<at>${escapeXml(mention.name)}</at>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
