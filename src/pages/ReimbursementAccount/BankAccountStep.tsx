import React from 'react';
import {View} from 'react-native';
import type {OnyxEntry} from 'react-native-onyx';
import {withOnyx} from 'react-native-onyx';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import Icon from '@components/Icon';
import * as Expensicons from '@components/Icon/Expensicons';
import LottieAnimations from '@components/LottieAnimations';
import MenuItem from '@components/MenuItem';
import PressableWithoutFeedback from '@components/Pressable/PressableWithoutFeedback';
import ScreenWrapper from '@components/ScreenWrapper';
import ScrollView from '@components/ScrollView';
import Section from '@components/Section';
import Text from '@components/Text';
import TextLink from '@components/TextLink';
import ValidateAccountMessage from '@components/ValidateAccountMessage';
import useLocalize from '@hooks/useLocalize';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import getPlaidDesktopMessage from '@libs/getPlaidDesktopMessage';
import * as BankAccounts from '@userActions/BankAccounts';
import * as Link from '@userActions/Link';
import * as ReimbursementAccount from '@userActions/ReimbursementAccount';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type {ReimbursementAccountForm} from '@src/types/form/ReimbursementAccountForm';
import INPUT_IDS from '@src/types/form/ReimbursementAccountForm';
import type * as OnyxTypes from '@src/types/onyx';
import BankInfo from './BankInfo/BankInfo';

type BankAccountStepOnyxProps = {
    /** Object with various information about the user */
    user: OnyxEntry<OnyxTypes.User>;

    /** If the plaid button has been disabled */
    isPlaidDisabled: OnyxEntry<boolean>;

    /** The details about the Personal bank account we are adding saved in Onyx */
    personalBankAccount: OnyxEntry<OnyxTypes.PersonalBankAccount>;
};

type BankAccountStepProps = BankAccountStepOnyxProps & {
    /** The OAuth URI + stateID needed to re-initialize the PlaidLink after the user logs into their bank */
    receivedRedirectURI?: string | null;

    /** During the OAuth flow we need to use the plaidLink token that we initially connected with */
    plaidLinkOAuthToken?: OnyxEntry<string>;

    /* The workspace name */
    policyName?: string;

    /* The workspace ID */
    policyID?: string;

    /** The bank account currently in setup */
    reimbursementAccount: OnyxEntry<OnyxTypes.ReimbursementAccount>;

    /** Goes to the previous step */
    onBackButtonPress: () => void;
};

const bankInfoStepKeys = INPUT_IDS.BANK_INFO_STEP;

function BankAccountStep({
    plaidLinkOAuthToken = '',
    policyID = '',
    policyName = '',
    user,
    receivedRedirectURI,
    reimbursementAccount,
    onBackButtonPress,
    isPlaidDisabled = false,
    personalBankAccount = {},
}: BankAccountStepProps) {
    const theme = useTheme();
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    let subStep = reimbursementAccount?.achData?.subStep ?? '';
    const shouldReinitializePlaidLink = plaidLinkOAuthToken && receivedRedirectURI && subStep !== CONST.BANK_ACCOUNT.SUBSTEP.MANUAL;
    if (shouldReinitializePlaidLink) {
        subStep = CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID;
    }
    const plaidDesktopMessage = getPlaidDesktopMessage();
    const bankAccountRoute = `${ROUTES.BANK_ACCOUNT_WITH_STEP_TO_OPEN.getRoute('new', policyID, ROUTES.WORKSPACE_INITIAL.getRoute(policyID))}`;

    const removeExistingBankAccountDetails = () => {
        const bankAccountData: Partial<ReimbursementAccountForm> = {
            [bankInfoStepKeys.ROUTING_NUMBER]: '',
            [bankInfoStepKeys.ACCOUNT_NUMBER]: '',
            [bankInfoStepKeys.PLAID_MASK]: '',
            [bankInfoStepKeys.IS_SAVINGS]: undefined,
            [bankInfoStepKeys.BANK_NAME]: '',
            [bankInfoStepKeys.PLAID_ACCOUNT_ID]: '',
            [bankInfoStepKeys.PLAID_ACCESS_TOKEN]: '',
        };
        ReimbursementAccount.updateReimbursementAccountDraft(bankAccountData);
    };

    if (subStep === CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID || subStep === CONST.BANK_ACCOUNT.SETUP_TYPE.MANUAL) {
        return (
            <BankInfo
                onBackButtonPress={onBackButtonPress}
                policyID={policyID}
            />
        );
    }

    return (
        <ScreenWrapper
            includeSafeAreaPaddingBottom={false}
            testID={BankAccountStep.displayName}
        >
            <View style={[styles.flex1, styles.justifyContentBetween]}>
                <HeaderWithBackButton
                    title={translate('workspace.common.connectBankAccount')}
                    subtitle={policyName}
                    stepCounter={subStep ? {step: 1, total: 5} : undefined}
                    onBackButtonPress={onBackButtonPress}
                    shouldShowGetAssistanceButton
                    guidesCallTaskID={CONST.GUIDES_CALL_TASK_IDS.WORKSPACE_BANK_ACCOUNT}
                />
                <ScrollView style={styles.flex1}>
                    <Section
                        title={translate('workspace.bankAccount.streamlinePayments')}
                        illustration={LottieAnimations.FastMoney}
                        subtitle={translate('bankAccount.toGetStarted')}
                        subtitleMuted
                        illustrationBackgroundColor={theme.fallbackIconColor}
                        isCentralPane
                    >
                        {!!plaidDesktopMessage && (
                            <View style={[styles.mv3, styles.flexRow, styles.justifyContentBetween]}>
                                <TextLink onPress={() => Link.openExternalLinkWithToken(bankAccountRoute)}>{translate(plaidDesktopMessage)}</TextLink>
                            </View>
                        )}
                        {!personalBankAccount.plaidAccountID && (
                            <View style={[styles.flexRow, styles.mt4, styles.alignItemsCenter, styles.pb1, styles.pt1]}>
                                <Icon
                                    src={Expensicons.Lightbulb}
                                    fill={theme.icon}
                                    additionalStyles={styles.mr2}
                                    medium
                                />
                                <Text
                                    style={[styles.textLabelSupportingNormal]}
                                    suppressHighlighting
                                >
                                    {translate('workspace.bankAccount.connectBankAccountNote')}
                                </Text>
                            </View>
                        )}
                        <View style={styles.mt3}>
                            <MenuItem
                                icon={Expensicons.Bank}
                                title={translate('bankAccount.connectOnlineWithPlaid')}
                                disabled={!!isPlaidDisabled || !user?.validated}
                                onPress={() => {
                                    if (!!isPlaidDisabled || !user?.validated) {
                                        return;
                                    }
                                    removeExistingBankAccountDetails();
                                    BankAccounts.openPlaidView();
                                }}
                                shouldShowRightIcon
                                wrapperStyle={[styles.cardMenuItem]}
                            />
                        </View>
                        <View style={styles.mv3}>
                            <MenuItem
                                icon={Expensicons.Connect}
                                title={translate('bankAccount.connectManually')}
                                disabled={!user?.validated}
                                onPress={() => {
                                    removeExistingBankAccountDetails();
                                    BankAccounts.setBankAccountSubStep(CONST.BANK_ACCOUNT.SETUP_TYPE.MANUAL);
                                }}
                                shouldShowRightIcon
                                wrapperStyle={[styles.cardMenuItem]}
                            />
                        </View>
                    </Section>
                    {!user?.validated && <ValidateAccountMessage />}
                    <View style={[styles.mv0, styles.mh5, styles.flexRow, styles.justifyContentBetween]}>
                        <TextLink href={CONST.PRIVACY_URL}>{translate('common.privacy')}</TextLink>
                        <PressableWithoutFeedback
                            onPress={() => Link.openExternalLink('https://community.expensify.com/discussion/5677/deep-dive-how-expensify-protects-your-information/')}
                            style={[styles.flexRow, styles.alignItemsCenter]}
                            accessibilityLabel={translate('bankAccount.yourDataIsSecure')}
                        >
                            <TextLink href="https://community.expensify.com/discussion/5677/deep-dive-how-expensify-protects-your-information/">
                                {translate('bankAccount.yourDataIsSecure')}
                            </TextLink>
                            <View style={styles.ml1}>
                                <Icon
                                    src={Expensicons.Lock}
                                    fill={theme.link}
                                />
                            </View>
                        </PressableWithoutFeedback>
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
}

BankAccountStep.displayName = 'BankAccountStep';

export default withOnyx<BankAccountStepProps, BankAccountStepOnyxProps>({
    user: {
        key: ONYXKEYS.USER,
    },
    isPlaidDisabled: {
        key: ONYXKEYS.IS_PLAID_DISABLED,
    },
    // @ts-expect-error: ONYXKEYS.PERSONAL_BANK_ACCOUNT is conflicting with ONYXKEYS.FORMS.PERSONAL_BANK_ACCOUNT_FORM
    personalBankAccount: {
        key: ONYXKEYS.PERSONAL_BANK_ACCOUNT,
    },
})(BankAccountStep);
