import type { BugReport } from './bug-report';

export type FailureType = 'selector_visible' | 'text_equals' | 'url_matches' | 'element_count';

export type BugPriority = BugReport['priority'];
export type BugReproducibility = BugReport['reproducibility'];
export type BugSeverity = BugReport['severity'];

type TriageDefaults = {
  severity: BugSeverity;
  priority: BugPriority;
  reproducibility: BugReproducibility;
  component: string;
};

const severityOrder: BugSeverity[] = ['blocker', 'critical', 'major', 'minor'];
const priorityOrder: BugPriority[] = ['p0', 'p1', 'p2', 'p3'];

const defaultByFailureType: Record<FailureType, TriageDefaults> = {
  selector_visible: {
    severity: 'major',
    priority: 'p1',
    reproducibility: 'always',
    component: 'UI',
  },
  text_equals: {
    severity: 'major',
    priority: 'p2',
    reproducibility: 'always',
    component: 'Content',
  },
  url_matches: {
    severity: 'minor',
    priority: 'p3',
    reproducibility: 'always',
    component: 'Navigation',
  },
  element_count: {
    severity: 'major',
    priority: 'p2',
    reproducibility: 'always',
    component: 'UI',
  },
};

const pickHighest = <T extends string>(order: T[], values: T[], fallback: T) => {
  if (values.length === 0) {
    return fallback;
  }
  return values.reduce((best, current) => (order.indexOf(current) < order.indexOf(best) ? current : best));
};

export const inferBugTriageDefaults = (failures: Array<{ type: FailureType }>): TriageDefaults => {
  if (failures.length === 0) {
    return {
      severity: 'minor',
      priority: 'p3',
      reproducibility: 'sometimes',
      component: 'General',
    };
  }

  const defaults = failures.map(failure => defaultByFailureType[failure.type]);
  const severity = pickHighest(
    severityOrder,
    defaults.map(item => item.severity),
    'minor'
  );
  const priority = pickHighest(
    priorityOrder,
    defaults.map(item => item.priority),
    'p3'
  );

  return {
    severity,
    priority,
    reproducibility: defaults[0].reproducibility,
    component: defaults[0].component,
  };
};
