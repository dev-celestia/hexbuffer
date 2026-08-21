//! Zero-allocation rule engine for fast in-place string mutations

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Rule {
    Lowercase,
    Uppercase,
    Capitalize,
    InvertCapitalize,
    Toggle,
    Reverse,
    Duplicate,
    DuplicateN(u8),
    Append(u8),
    Prepend(u8),
    DeleteFirst,
    DeleteLast,
    DeleteAt(usize),
    LeetSpeak,
    ToggleCase,
    RotateLeft,
    RotateRight,
}

#[derive(Debug, Clone, Default)]
pub struct RuleSet {
    rules: Vec<Rule>,
}

impl RuleSet {
    pub fn new(rules: Vec<Rule>) -> Self {
        Self { rules }
    }

    pub fn is_empty(&self) -> bool {
        self.rules.is_empty()
    }

    pub fn apply(&self, input: &mut [u8], len: &mut usize) {
        for rule in &self.rules {
            apply_rule(input, len, rule);
        }
    }

    pub fn apply_to_vec(&self, input: &[u8]) -> Vec<u8> {
        let mut buf = [0u8; 128];
        let copy_len = input.len().min(128);
        buf[..copy_len].copy_from_slice(&input[..copy_len]);
        let mut len = copy_len;
        self.apply(&mut buf, &mut len);
        buf[..len].to_vec()
    }
}

#[inline(always)]
pub fn apply_rule(buf: &mut [u8], len: &mut usize, rule: &Rule) {
    if *len == 0 && !matches!(rule, Rule::Append(_) | Rule::Prepend(_)) {
        return;
    }

    match rule {
        Rule::Lowercase => {
            for b in &mut buf[..*len] {
                *b = b.to_ascii_lowercase();
            }
        }
        Rule::Uppercase => {
            for b in &mut buf[..*len] {
                *b = b.to_ascii_uppercase();
            }
        }
        Rule::Capitalize => {
            if *len > 0 {
                buf[0] = buf[0].to_ascii_uppercase();
                for b in &mut buf[1..*len] {
                    *b = b.to_ascii_lowercase();
                }
            }
        }
        Rule::InvertCapitalize => {
            if *len > 0 {
                buf[0] = buf[0].to_ascii_lowercase();
                for b in &mut buf[1..*len] {
                    *b = b.to_ascii_uppercase();
                }
            }
        }
        Rule::Toggle => {
            for b in &mut buf[..*len] {
                if b.is_ascii_lowercase() {
                    *b = b.to_ascii_uppercase();
                } else if b.is_ascii_uppercase() {
                    *b = b.to_ascii_lowercase();
                }
            }
        }
        Rule::Reverse => {
            buf[..*len].reverse();
        }
        Rule::Duplicate => {
            if *len > 0 && *len * 2 <= buf.len() {
                let current_len = *len;
                buf.copy_within(0..current_len, current_len);
                *len *= 2;
            }
        }
        Rule::DuplicateN(n) => {
            let n = *n as usize;
            if *len > 0 && *len * (n + 1) <= buf.len() {
                let current_len = *len;
                for i in 1..=n {
                    buf.copy_within(0..current_len, current_len * i);
                }
                *len *= n + 1;
            }
        }
        Rule::Append(c) => {
            if *len < buf.len() {
                buf[*len] = *c;
                *len += 1;
            }
        }
        Rule::Prepend(c) => {
            if *len < buf.len() {
                buf.copy_within(0..*len, 1);
                buf[0] = *c;
                *len += 1;
            }
        }
        Rule::DeleteFirst => {
            if *len > 0 {
                buf.copy_within(1..*len, 0);
                *len -= 1;
            }
        }
        Rule::DeleteLast => {
            if *len > 0 {
                *len -= 1;
            }
        }
        Rule::DeleteAt(idx) => {
            if *idx < *len {
                buf.copy_within((*idx + 1)..*len, *idx);
                *len -= 1;
            }
        }
        Rule::LeetSpeak => {
            for b in &mut buf[..*len] {
                *b = match *b {
                    b'a' | b'A' => b'4',
                    b'e' | b'E' => b'3',
                    b'i' | b'I' => b'1',
                    b'o' | b'O' => b'0',
                    b's' | b'S' => b'5',
                    b't' | b'T' => b'7',
                    b'b' | b'B' => b'8',
                    _ => *b,
                };
            }
        }
        Rule::ToggleCase => {
            for b in &mut buf[..*len] {
                if b.is_ascii_lowercase() {
                    *b = b.to_ascii_uppercase();
                } else if b.is_ascii_uppercase() {
                    *b = b.to_ascii_lowercase();
                }
            }
        }
        Rule::RotateLeft => {
            if *len > 1 {
                let first = buf[0];
                buf.copy_within(1..*len, 0);
                buf[*len - 1] = first;
            }
        }
        Rule::RotateRight => {
            if *len > 1 {
                let last = buf[*len - 1];
                buf.copy_within(0..(*len - 1), 1);
                buf[0] = last;
            }
        }
    }
}

/// Parse Hashcat-style rule string or identifier
pub fn parse_rule_line(line: &str) -> Option<RuleSet> {
    let mut rules = Vec::new();
    let chars: Vec<char> = line.chars().collect();
    let mut i = 0;

    while i < chars.len() {
        let ch = chars[i];
        match ch {
            ':' => {} // No-op rule in hashcat
            'l' => rules.push(Rule::Lowercase),
            'u' => rules.push(Rule::Uppercase),
            'c' => rules.push(Rule::Capitalize),
            'C' => rules.push(Rule::InvertCapitalize),
            't' => rules.push(Rule::Toggle),
            'T' => rules.push(Rule::ToggleCase),
            'r' => rules.push(Rule::Reverse),
            'd' => rules.push(Rule::Duplicate),
            'f' => rules.push(Rule::DeleteFirst),
            ']' => rules.push(Rule::DeleteLast),
            '[' => rules.push(Rule::DeleteFirst),
            '{' => rules.push(Rule::RotateLeft),
            '}' => rules.push(Rule::RotateRight),
            'L' => rules.push(Rule::LeetSpeak),
            '$' => {
                if i + 1 < chars.len() {
                    i += 1;
                    rules.push(Rule::Append(chars[i] as u8));
                }
            }
            '^' => {
                if i + 1 < chars.len() {
                    i += 1;
                    rules.push(Rule::Prepend(chars[i] as u8));
                }
            }
            'p' => {
                if i + 1 < chars.len() {
                    i += 1;
                    if let Some(d) = chars[i].to_digit(10) {
                        rules.push(Rule::DuplicateN(d as u8));
                    }
                }
            }
            _ => {}
        }
        i += 1;
    }

    if rules.is_empty() {
        None
    } else {
        Some(RuleSet::new(rules))
    }
}

pub fn parse_rule_list(lines: &[String]) -> Vec<RuleSet> {
    let mut rule_sets = Vec::new();
    for line in lines {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        if let Some(set) = parse_rule_line(trimmed) {
            rule_sets.push(set);
        }
    }
    rule_sets
}
