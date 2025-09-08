import { utils } from '@ohif/ui-next';

import ToolbarLayoutSelectorWithServices from './Toolbar/ToolbarLayoutSelector';

// legacy
import { ProgressDropdownWithService } from './Components/ProgressDropdownWithService';

// new
import ToolButtonListWrapper from './Toolbar/ToolButtonListWrapper';
import ToolRowWrapper from './Toolbar/ToolRowWrapper';
import { ToolBoxButtonGroupWrapper, ToolBoxButtonWrapper } from './Toolbar/ToolBoxWrapper';
import { ToolButtonWrapper } from './Toolbar/ToolButtonWrapper';
import ShareButton from './Components/ShareButton';

export default function getToolbarModule({ commandsManager, servicesManager }: withAppTypes) {
  const { cineService } = servicesManager.services;
  return [
    // new
    {
      name: 'ohif.toolButton',
      defaultComponent: ToolButtonWrapper,
    },
    {
      name: 'ohif.toolButtonList',
      defaultComponent: ToolButtonListWrapper,
    },
    {
      name: 'ohif.row',
      defaultComponent: ToolRowWrapper,
    },
    {
      name: 'ohif.toolBoxButtonGroup',
      defaultComponent: ToolBoxButtonGroupWrapper,
    },
    {
      name: 'ohif.toolBoxButton',
      defaultComponent: ToolBoxButtonWrapper,
    },
    // others
    {
      name: 'ohif.shareButton',
      defaultComponent: props => (
        <ShareButton
          {...props}
          servicesManager={servicesManager}
          commandsManager={commandsManager}
        />
      ),
    },
    {
      name: 'ohif.layoutSelector',
      defaultComponent: props =>
        ToolbarLayoutSelectorWithServices({ ...props, commandsManager, servicesManager }),
    },
    {
      name: 'ohif.progressDropdown',
      defaultComponent: ProgressDropdownWithService,
    },
    {
      name: 'evaluate.cine',
      evaluate: () => {
        const isToggled = cineService.getState().isCineEnabled;
        return {
          className: utils.getToggledClassName(isToggled),
        };
      },
    },
  ];
}
