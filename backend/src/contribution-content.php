<?php
declare(strict_types=1);

const CONTRIBUTION_RICH_TEXT_PREFIX = 'sb-rich-v1:';

function normalizeContributionRichTextNode(mixed $value, int &$nodeCount, int $depth = 0): array
{
    $nodeCount++;
    if ($nodeCount > 100000 || $depth > 4 || !is_array($value) || !is_string($value['type'] ?? null)) {
        throw new InvalidArgumentException('The formatted contribution has an invalid structure.');
    }

    $type = $value['type'];
    if ($type === 'doc' && $depth === 0) {
        if (!is_array($value['content'] ?? null) || !array_is_list($value['content'])) {
            throw new InvalidArgumentException('The formatted contribution document is invalid.');
        }
        $content = [];
        foreach ($value['content'] as $child) {
            $normalized = normalizeContributionRichTextNode($child, $nodeCount, $depth + 1);
            if ($normalized['type'] !== 'paragraph') {
                throw new InvalidArgumentException('The formatted contribution document contains an unsupported block.');
            }
            $content[] = $normalized;
        }
        return ['type' => 'doc', 'content' => $content];
    }

    if ($type === 'paragraph') {
        $paragraphContent = $value['content'] ?? [];
        if (!is_array($paragraphContent) || !array_is_list($paragraphContent)) {
            throw new InvalidArgumentException('The formatted contribution paragraph is invalid.');
        }
        $attrs = $value['attrs'] ?? [];
        if (!is_array($attrs)) {
            throw new InvalidArgumentException('The formatted contribution alignment is invalid.');
        }
        $alignment = $attrs['textAlign'] ?? null;
        if ($alignment !== null && !in_array($alignment, ['left', 'center', 'right', 'justify'], true)) {
            throw new InvalidArgumentException('The formatted contribution alignment is not supported.');
        }
        $content = [];
        foreach ($paragraphContent as $child) {
            $normalized = normalizeContributionRichTextNode($child, $nodeCount, $depth + 1);
            if (!in_array($normalized['type'], ['text', 'hardBreak'], true)) {
                throw new InvalidArgumentException('The formatted contribution paragraph contains an unsupported node.');
            }
            $content[] = $normalized;
        }
        return [
            'type' => 'paragraph',
            'attrs' => ['textAlign' => $alignment],
            'content' => $content,
        ];
    }

    if ($type === 'text' && is_string($value['text'] ?? null)) {
        $marks = $value['marks'] ?? [];
        if (!is_array($marks) || !array_is_list($marks)) {
            throw new InvalidArgumentException('The formatted contribution text marks are invalid.');
        }
        $normalizedMarks = [];
        foreach ($marks as $mark) {
            if (!is_array($mark) || !in_array($mark['type'] ?? null, ['bold', 'highlight'], true)) {
                throw new InvalidArgumentException('The formatted contribution contains an unsupported text style.');
            }
            $normalizedMarks[] = ['type' => $mark['type']];
        }
        $node = ['type' => 'text', 'text' => $value['text']];
        if ($normalizedMarks !== []) {
            $node['marks'] = $normalizedMarks;
        }
        return $node;
    }

    if ($type === 'hardBreak') {
        return ['type' => 'hardBreak'];
    }

    throw new InvalidArgumentException('The formatted contribution contains an unsupported element.');
}

function normalizeContributionContent(string $content): string
{
    if (!str_starts_with($content, CONTRIBUTION_RICH_TEXT_PREFIX)) {
        return $content;
    }
    if (strlen($content) > 4000000) {
        throw new InvalidArgumentException('The formatted contribution is too large.');
    }

    try {
        $document = json_decode(
            substr($content, strlen(CONTRIBUTION_RICH_TEXT_PREFIX)),
            true,
            512,
            JSON_THROW_ON_ERROR,
        );
    } catch (JsonException) {
        throw new InvalidArgumentException('The formatted contribution is not valid JSON.');
    }

    $nodeCount = 0;
    $normalized = normalizeContributionRichTextNode($document, $nodeCount);
    if ($normalized['type'] !== 'doc') {
        throw new InvalidArgumentException('The formatted contribution must start with a document.');
    }
    return CONTRIBUTION_RICH_TEXT_PREFIX . json_encode(
        $normalized,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR,
    );
}

function contributionContentHasText(string $content): bool
{
    if (!str_starts_with($content, CONTRIBUTION_RICH_TEXT_PREFIX)) {
        return trim($content) !== '';
    }
    try {
        $document = json_decode(substr($content, strlen(CONTRIBUTION_RICH_TEXT_PREFIX)), true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        return false;
    }

    $containsText = static function (mixed $node) use (&$containsText): bool {
        if (!is_array($node)) {
            return false;
        }
        if (($node['type'] ?? null) === 'text' && trim((string) ($node['text'] ?? '')) !== '') {
            return true;
        }
        foreach ($node['content'] ?? [] as $child) {
            if ($containsText($child)) {
                return true;
            }
        }
        return false;
    };

    return $containsText($document);
}
