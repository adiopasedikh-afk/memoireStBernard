import {
  getContributionDocument,
  repairMojibake,
  type ContributionTextNode,
} from '@/app/lib/contributionRichText';

interface ContributionContentProps {
  content: string;
  className?: string;
}

function renderNode(node: ContributionTextNode, key: string): React.ReactNode {
  if (node.type === 'text') {
    return (node.marks ?? []).reduce<React.ReactNode>((text, mark, index) => {
      if (mark.type === 'bold') return <strong key={`${key}-bold-${index}`}>{text}</strong>;
      return (
        <mark key={`${key}-highlight-${index}`} className="rounded bg-yellow-300 px-0.5 text-slate-950">
          {text}
        </mark>
      );
    }, repairMojibake(node.text ?? ''));
  }
  if (node.type === 'hardBreak') return <br key={key} />;

  const children = (node.content ?? []).map((child, index) => renderNode(child, `${key}-${index}`));
  if (node.type === 'doc') return <div key={key}>{children}</div>;
  const alignment = node.attrs?.textAlign ?? 'left';
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  }[alignment];
  return (
    <p key={key} className={`whitespace-pre-wrap leading-relaxed ${alignmentClass}`}>
      {children}
    </p>
  );
}

export default function ContributionContent({ content, className }: ContributionContentProps) {
  const document = getContributionDocument(content);
  if (!document) {
    return <p className={`whitespace-pre-wrap leading-relaxed ${className ?? ''}`}>{repairMojibake(content)}</p>;
  }

  return <div className={className}>{renderNode(document, 'contribution')}</div>;
}
