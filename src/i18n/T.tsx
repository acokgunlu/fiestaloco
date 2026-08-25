import React from 'react';
import { t } from './index';

/**
 * İçinde biçimlendirilmiş parça geçen cümleler için.
 *
 * Bazı cümlelerin ortasında `<strong>` gibi etiketler var:
 *
 *   Kamerayla okutun veya <strong>{host}</strong> adresine girip
 *   <strong>{code}</strong> yazın.
 *
 * Bunu parça parça çevirmek imkânsız — "Kamerayla okutun veya" ile "adresine
 * girip" ayrı ayrı çevrilince İngilizce'de kelime sırası tutmaz. Cümlenin
 * TAMAMI tek anahtar olmalı ki çevirmen yer tutucuları istediği yere koyabilsin:
 *
 *   <T k="Kamerayla okutun veya {host} adresine girip {code} yazın."
 *      v={{ host: <strong>…</strong>, code: <strong>…</strong> }} />
 *
 * İngilizce karşılık yer tutucuları farklı sırada kullanabilir; bu bileşen
 * çevrilmiş metni bölüp parçaları yerine oturtur.
 */
interface Props {
  /** Kaynak metin — yer tutucular {ad} biçiminde. */
  k: string;
  /** Yer tutucu adı -> yerine konacak düğüm. */
  v?: Record<string, React.ReactNode>;
}

const PLACEHOLDER = /(\{[a-zA-Z_][a-zA-Z0-9_]*\})/g;

export const T: React.FC<Props> = ({ k, v }) => {
  const translated = t(k);
  if (!v) return <>{translated}</>;

  return (
    <>
      {translated.split(PLACEHOLDER).map((part, i) => {
        const m = /^\{([a-zA-Z_][a-zA-Z0-9_]*)\}$/.exec(part);
        if (m && v[m[1]] !== undefined) {
          return <React.Fragment key={i}>{v[m[1]]}</React.Fragment>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};
