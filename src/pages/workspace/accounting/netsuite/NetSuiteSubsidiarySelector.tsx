import type {StackScreenProps} from '@react-navigation/stack';
import React from 'react';
import ConnectionLayout from '@components/ConnectionLayout';
import OfflineWithFeedback from '@components/OfflineWithFeedback';
import SelectionList from '@components/SelectionList';
import RadioListItem from '@components/SelectionList/RadioListItem';
import type {ListItem} from '@components/SelectionList/types';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import * as ErrorUtils from '@libs/ErrorUtils';
import Navigation from '@libs/Navigation/Navigation';
import type {SettingsNavigatorParamList} from '@libs/Navigation/types';
import withPolicy from '@pages/workspace/withPolicy';
import type {WithPolicyProps} from '@pages/workspace/withPolicy';
import * as Policy from '@userActions/Policy/Policy';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';

type NetSuiteSubsidiarySelectorProps = WithPolicyProps & StackScreenProps<SettingsNavigatorParamList, typeof SCREENS.WORKSPACE.ACCOUNTING.NET_SUITE_SUBSIDIARY_SELECTOR>;
function NetSuiteSubsidiarySelector({
    policy,
}: NetSuiteSubsidiarySelectorProps) {
    const {translate} = useLocalize();
    const styles = useThemeStyles();
    const subsidiaryList = policy?.connections?.netsuite?.options?.data?.subsidiaryList ?? [];
    const netsuiteConfig = policy?.connections?.netsuite?.options?.config;
    const policyID = policy?.id ?? '';

    const sections = subsidiaryList.map((subsidiary) => ({
            text: subsidiary.name,
            keyForList: subsidiary.name,
            isSelected: subsidiary.name === netsuiteConfig?.subsidiary ?? '',
        })) ?? [];

    const saveSelection = ({keyForList}: ListItem) => {
        if (!keyForList) {
            return;
        }

        Navigation.goBack(ROUTES.WORKSPACE_ACCOUNTING.getRoute(policyID));
    };

    return (
        <ConnectionLayout
            displayName={NetSuiteSubsidiarySelector.displayName}
            headerTitle="workspace.netsuite.subsidiary"
            accessVariants={[CONST.POLICY.ACCESS_VARIANTS.ADMIN, CONST.POLICY.ACCESS_VARIANTS.PAID]}
            policyID={policyID}
            featureName={CONST.POLICY.MORE_FEATURES.ARE_CONNECTIONS_ENABLED}
            shouldIncludeSafeAreaPaddingBottom
            connectionName={CONST.POLICY.CONNECTIONS.NAME.NET_SUITE}
        >
            <OfflineWithFeedback
                errors={ErrorUtils.getLatestErrorField(netsuiteConfig ?? {}, CONST.NET_SUITE_CONFIG.SUBSIDIARY)}
                errorRowStyles={[styles.ph5, styles.mt2]}
                onClose={() => Policy.clearConnectionErrorField(policyID, CONST.POLICY.CONNECTIONS.NAME.NET_SUITE, CONST.NET_SUITE_CONFIG.SUBSIDIARY)}
            >
                <Text style={[styles.ph5, styles.pb5]}>{translate('workspace.netsuite.subsidiarySelectDescription')}</Text>
                <SelectionList
                    containerStyle={styles.pb0}
                    ListItem={RadioListItem}
                    onSelectRow={saveSelection}
                    shouldDebounceRowSelect
                    sections={[{data: sections}]}
                    initiallyFocusedOptionKey={netsuiteConfig?.subsidiary ?? ''}
                />
            </OfflineWithFeedback>
        </ConnectionLayout>
    );
}

NetSuiteSubsidiarySelector.displayName = 'NetSuiteSubsidiarySelector';

export default withPolicy(NetSuiteSubsidiarySelector);
