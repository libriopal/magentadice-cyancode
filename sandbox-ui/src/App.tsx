import type { ReactElement } from 'react';
import './App.css';

import { Button } from '@progress/kendo-react-buttons';
import { AppBar, AppBarSection, AppBarSpacer, Card, CardBody } from '@progress/kendo-react-layout';
import { SvgIcon } from '@progress/kendo-react-common';
import { chevronRightIcon } from '@progress/kendo-svg-icons';
import kendoReactLogo from './assets/ProgressKendoReact_logo.svg';

interface ResourceItem {
  label: string;
  href: string;
}

interface ResourceGroup {
  heading: string;
  items: ResourceItem[];
}

const resourceGroups: ResourceGroup[] = [
  {
    heading: 'AI Tools',
    items: [
      { label: 'AI Tools Overview', href: 'https://www.telerik.com/kendo-react-ui/components/ai-tools?utm_source=cli&utm_medium=project_template&utm_campaign=ai_tools_overview' },
      { label: 'AI Components', href: 'https://www.telerik.com/kendo-react-ui/components/ai-components?utm_source=cli&utm_medium=project_template&utm_campaign=ai_components_hub' },
    ],
  },
  {
    heading: 'Components',
    items: [
      { label: 'Explore the Demos', href: 'https://www.telerik.com/kendo-react-ui/components/?utm_source=cli&utm_medium=project_template&utm_campaign=components_hub' },
      { label: 'Kendo Themes & Styling', href: 'https://www.telerik.com/kendo-react-ui/components/styling?utm_source=cli&utm_medium=project_template&utm_campaign=styling_overview' },
      { label: 'GitHub Repository', href: 'https://github.com/telerik/kendo-react?utm_source=cli&utm_medium=project_template&utm_campaign=react_repo' },
    ],
  },
];

interface ResourceItemProps {
  dataItem: ResourceItem;
}

const ResourceItem = ({ dataItem }: ResourceItemProps): ReactElement => {
  return (
    <Button
      className="resources-link"
      size="large"
      rounded="large"
      fillMode='solid'
      endIcon={<SvgIcon icon={chevronRightIcon} size="xlarge" />}
      onClick={() => {
        window.open(dataItem.href, '_blank', 'noopener,noreferrer');
      }}
    >
      {dataItem.label}
    </Button>
  );
};

function App(): ReactElement {
  return (
    <>
      <header>
        <AppBar className="app-header" themeColor="light" positionMode="sticky">
          <div className="app-header-inner">
            <AppBarSection>
              <a href="https://www.telerik.com/kendo-react-ui?utm_source=cli&utm_medium=project_template&utm_campaign=kendoreact" className="app-logo" aria-label="Progress KendoReact – go to home">
                <img src={kendoReactLogo} alt="KendoReact Logo" />
              </a>
            </AppBarSection>

            <AppBarSpacer />
          </div>
        </AppBar>
      </header>

      <main className="page-main" id="main-content">
        <div className="hero-section">
          <h1 className="hero-heading">
            Hello, Kendo <span className="accent">React</span> Project
          </h1>
          <p className="hero-subtitle">Congratulations! Your app is running.</p>
        </div>

        <section aria-labelledby="promo-heading">
          <Card className="promo-card">
            <CardBody>
              <div className="promo-card-inner">
                <div className="promo-text">
                  <h2 id="promo-heading" className="promo-title">Agentic UI Generator</h2>
                  <p className="promo-description">
                    Turn prompts into pages. Boost your productivity with the Agentic UI Generator
                  </p>
                </div>
                <Button
                  type="button"
                  className="btn-gradient"
                  themeColor="primary"
                  rounded="large"
                  size="large"
                  endIcon={<SvgIcon icon={chevronRightIcon} />}
                  aria-label="Try Now - Agentic UI Generator"
                  onClick={() =>
                    window.open(
                      'https://www.telerik.com/kendo-react-ui/components/ai-tools/agentic-ui-generator/prompt-library?utm_source=cli&utm_medium=project_template&utm_campaign=ai_tools_prompt_library',
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                >
                  Try Now
                </Button>
              </div>
            </CardBody>
          </Card>
        </section>

        <section aria-label="Resources">
          <div className="resources-grid">
            {resourceGroups.map((group) => (
              <div className="resources-column" key={group.heading}>
                <h2 className="resources-heading">{group.heading}</h2>
                <div className="resources-list">
                  {group.items.map((item) => (
                    <ResourceItem key={item.href} dataItem={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

export default App;
