import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DateField, FormRow } from '@/components/forms/Fields';

describe('DateField', () => {
  it('usa o mesmo campo base dos demais (rótulo, erro, acessibilidade) com o tipo nativo correto', () => {
    render(
      <FormRow>
        <DateField label="Data" value="2026-11-07" onChange={() => undefined} />
        <DateField label="Primeira parcela" kind="month" value="2026-11" onChange={() => undefined} error="Informe o mês." />
      </FormRow>,
    );
    const date = screen.getByLabelText('Data');
    const month = screen.getByLabelText('Primeira parcela');
    expect(date).toHaveAttribute('type', 'date');
    expect(month).toHaveAttribute('type', 'month');
    expect(date.className).toMatch(/input/);
    expect(date.className).toMatch(/dateInput/);
    expect(month).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o mês.');
  });
});
