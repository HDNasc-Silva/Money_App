import { Link } from 'react-router-dom';
import { Icon } from '@/components/common/Icon';
import { MORE_NAV_GROUPS } from '@/components/layout/navItems';
import { Page } from '@/components/layout/Page';
import styles from './More.module.css';

/**
 * Hub "Mais" (DT-021): agrupa os destinos que não cabem na barra inferior principal
 * (Gastos, Assinaturas, Gráficos e Ajustes), cada um com ícone, nome e descrição curta.
 */
export function MorePage() {
  return (
    <Page title="Mais" description="Outras áreas do app, organizadas por assunto.">
      <div className={styles.groups}>
        {MORE_NAV_GROUPS.map((group) => (
          <section key={group.title} className={styles.group} aria-labelledby={`more-group-${group.title}`}>
            <h2 id={`more-group-${group.title}`} className={styles.groupTitle}>
              {group.title}
            </h2>
            <div className={styles.list}>
              {group.entries.map(({ item, description }) => (
                <Link key={item.to} to={item.to} className={styles.entry}>
                  <span className={styles.entryIcon}>
                    <Icon name={item.icon} size={22} />
                  </span>
                  <span className={styles.entryText}>
                    <span className={styles.entryLabel}>{item.label}</span>
                    <span className={styles.entryDescription}>{description}</span>
                  </span>
                  <Icon name="chevron_right" size={20} className={styles.entryChevron} />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Page>
  );
}
