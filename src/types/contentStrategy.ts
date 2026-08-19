export interface ContentStrategyFormData {
  company_name: string;
  website_url?: string;
  sector: string;
  company_size: 'solo' | 'kmo' | 'mid-market' | 'enterprise';
  geo_market: string;
  sales_cycle: 'short' | 'medium' | 'long';
  current_maturity: 'low' | 'medium' | 'high';

  primary_goal: 'thought_leadership' | 'lead_generation' | 'demand_creation' | 'employer_branding';
  time_horizon_months: number;
  success_definition: string[];
  north_star_metric?: string;
  constraints?: string[];

  target_roles: string[];
  decision_level: 'operational' | 'tactical' | 'strategic';
  awareness_level: 'low' | 'medium' | 'high';
  pain_points: string[];
  objections?: string[];
  buying_triggers?: string[];

  core_services: string[];
  key_differentiators: string[];
  topics_to_avoid?: string[];
  proof_assets?: string[];

  primary_channel: 'linkedin';
  secondary_channels: string[];
  posts_per_week: number;
  blog_frequency: 'weekly' | 'biweekly' | 'monthly';
  case_frequency: 'weekly' | 'biweekly' | 'monthly';
  case_day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

  output_language: string;
  strategy_depth: 'light' | 'standard' | 'advanced';
  detail_level: 'low' | 'medium' | 'high';
  include_examples: boolean;
  include_weekly_calendar: boolean;
  calendar_weeks: number;
  include_content_formats: boolean;
  include_kpis: boolean;
  include_reuse_plan: boolean;
}

export interface LinkedInPost {
  day: string;
  format: string;
  hook: string;
  bullets: string[];
  cta: string;
  hashtags: string[];
}

export interface BlogPost {
  title: string;
  angle: string;
  buyer_stage: string;
  target_role: string;
  primary_keyword: string;
  outline_h2: string[];
}

export interface CaseStudy {
  context: string;
  problem: string;
  common_mistake: string;
  approach: string;
  result_metric_type: string;
  anonymization_note: string;
}

export interface WeeklyContent {
  week_number: number;
  blog: BlogPost;
  linkedin_posts: LinkedInPost[];
  case_study?: CaseStudy;
}

export interface ContentStrategy {
  strategy_objective: string;
  narrative_arc: string;
  content_pillars: string[];
  cadence: {
    linkedin_posts_per_week: number;
    blog_frequency: string;
    case_frequency: string;
    case_day: string;
  };
  recurring_formats: string[];
  calendar_12_weeks: WeeklyContent[];
  kpis: {
    primary_metrics: string[];
    measurement_notes: string;
  };
  scaling_and_reuse: string;
  assumptions: string[];
}
