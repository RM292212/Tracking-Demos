import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type GtmParameter = { key?: string; value?: string; list?: GtmParameter[]; map?: GtmParameter[]; parameter?: GtmParameter[]; name?: string; type?: string };
type GtmAsset = { name: string; type?: string; paused?: boolean; parameter?: GtmParameter[]; firingTriggerId?: string[]; customEventFilter?: GtmParameter[] };

const exportFile = path.resolve(process.cwd(), '../gtm/responselock-demo-container.json');
const gtmExport = JSON.parse(readFileSync(exportFile, 'utf8')) as {
  exportFormatVersion: number;
  containerVersion: { tag: GtmAsset[]; trigger: GtmAsset[]; variable: GtmAsset[]; container: { publicId: string } };
};

function getList(asset: GtmAsset, key: string): GtmParameter[] {
  return asset.parameter?.find((parameter) => parameter.key === key)?.list ?? [];
}

describe('GTM import template', () => {
  it('is a Version 2 Web container template with the exact demo event trigger', () => {
    expect(gtmExport.exportFormatVersion).toBe(2);
    expect(gtmExport.containerVersion.container.publicId).toMatch(/^GTM-[A-Z0-9]{7,}$/);
    const trigger = gtmExport.containerVersion.trigger.find((item) => item.name === 'CE - demo_lead_success');
    expect(trigger?.type).toBe('CUSTOM_EVENT');
    expect(trigger?.customEventFilter?.[0]?.parameter?.map((item) => item.value)).toEqual([
      '{{_event}}',
      'demo_lead_success',
    ]);
    expect(trigger?.customEventFilter?.slice(1, 3).map((filter) => filter.parameter?.map((item) => item.value))).toEqual([
      ['{{dlv - form_id}}', 'alder_consultation'],
      ['{{dlv - lead_type}}', 'consultation'],
    ]);
    expect(trigger?.customEventFilter?.[3]?.type).toBe('MATCH_REGEX');
    expect(trigger?.customEventFilter?.[3]?.parameter?.[0]?.value).toBe('{{dlv - submission_id}}');
    expect(trigger?.customEventFilter?.[3]?.parameter?.[1]?.value).toBe('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');
  });

  it('maps the complete V2 event parameter set through Data Layer Version 2 variables', () => {
    const required = [
      'form_id', 'lead_type', 'submission_id', 'attribution_status', 'utm_source',
      'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'timestamp', 'debug_mode',
    ];
    const eventTag = gtmExport.containerVersion.tag.find((item) => item.name === 'GA4 Event - demo_lead_success');
    expect(eventTag?.type).toBe('gaawe');
    expect(eventTag?.paused).toBe(true);
    expect(getList(eventTag!, 'eventParameters').map((item) => item.map?.find((entry) => entry.key === 'name')?.value)).toEqual(required);

    const variables = gtmExport.containerVersion.variable;
    for (const key of required) {
      const variable = variables.find((item) => item.name === `dlv - ${key}`);
      expect(variable?.type).toBe('v');
      expect(variable?.parameter?.find((item) => item.key === 'dataLayerVersion')?.value).toBe('2');
      expect(variable?.parameter?.find((item) => item.key === 'name')?.value).toBe(key);
    }
    expect(variables).toHaveLength(required.length + 1);
  });

  it('keeps Google Ads architecture paused with explicit replacement placeholders', () => {
    const tags = gtmExport.containerVersion.tag;
    expect(tags.every((item) => item.paused === true)).toBe(true);
    expect(gtmExport.containerVersion.variable.find((item) => item.name === 'const - ga4_measurement_id')?.parameter?.find((item) => item.key === 'value')?.value).toBe(`G-${'X'.repeat(10)}`);
    const linker = tags.find((item) => item.name === 'Google Ads - Conversion Linker (paused template)');
    const conversion = tags.find((item) => item.name === 'Google Ads - Lead Conversion (paused template)');
    expect(linker?.type).toBe('gclidw');
    expect(linker?.paused).toBe(true);
    expect(conversion?.type).toBe('awct');
    expect(conversion?.paused).toBe(true);
    expect(conversion?.parameter?.find((item) => item.key === 'conversionId')?.value).toBe('REPLACE_WITH_REAL_GOOGLE_ADS_CONVERSION_ID');
    expect(conversion?.parameter?.find((item) => item.key === 'conversionLabel')?.value).toBe('REPLACE_WITH_REAL_GOOGLE_ADS_CONVERSION_LABEL');
  });
});
