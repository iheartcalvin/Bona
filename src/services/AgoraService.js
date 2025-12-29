import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType } from 'react-native-agora';
import { Alert, Platform } from 'react-native';

class AgoraService {
    constructor() {
        this._engine = null;
        this._isInChannel = false;
        this.appId = null;
    }

    async initialize(appId) {
        if (this._engine && this.appId === appId) return;

        if (this._engine && this.appId !== appId) {
            console.log('AgoraService: AppID changed, re-initializing...');
            await this.destroy();
        }

        this.appId = appId;
        console.log('AgoraService: Initializing with AppID:', appId);

        try {
            this._engine = createAgoraRtcEngine();
            this._engine.initialize({ appId });

            // Register event listeners
            this._engine.registerEventHandler({
                onWarning: (warn, msg) => {
                    console.log('Agora Warning:', warn, msg);
                },
                onError: (err, msg) => {
                    console.error('Agora Error:', err, msg);
                },
                onUserJoined: (connection, uid, elapsed) => {
                    console.log('Agora UserJoined:', uid, elapsed);
                },
                onUserOffline: (connection, uid, reason) => {
                    console.log('Agora UserOffline:', uid, reason);
                },
                onJoinChannelSuccess: (connection, elapsed) => {
                    console.log('Agora JoinChannelSuccess:', connection.channelId, connection.localUid, elapsed);
                    this._isInChannel = true;
                    // Default to speakerphone on mobile
                    this._engine.setEnableSpeakerphone(true);
                },
            });

            await this._engine.enableAudio();
            // Default to speakerphone
            await this._engine.setDefaultAudioRouteToSpeakerphone(true);
            // 0 = Communication, 1 = LiveBroadcasting
            // In v4, we use Enum values directly if possible, or integers.
            // ChannelProfileType.ChannelProfileLiveBroadcasting = 1
            await this._engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);

            console.log('Agora Engine Initialized');
        } catch (e) {
            console.error('Agora Init Error:', e);
            // Alert.alert('Audio Error', 'Could not initialize voice system.');
        }
    }

    async joinChannel(channelId, uid, role = 'listener', token = '') {
        if (!this._engine) return;

        try {
            // Set role
            // ClientRoleType.ClientRoleBroadcaster = 1
            // ClientRoleType.ClientRoleAudience = 2
            const clientRole = (role === 'host' || role === 'speaker')
                ? ClientRoleType.ClientRoleBroadcaster
                : ClientRoleType.ClientRoleAudience;

            await this._engine.setClientRole(clientRole);

            // If broadcaster, enable local audio
            if (clientRole === ClientRoleType.ClientRoleBroadcaster) {
                await this._engine.enableLocalAudio(true);
            } else {
                await this._engine.enableLocalAudio(false);
            }

            // Join
            // joinChannel(token, channelId, uid, options)
            // WORKAROUND: Agora needs INT uid. Passing 0 lets Agora assign one.
            console.log('AgoraService: Joining channel:', channelId, 'with token length:', token?.length || 0);
            await this._engine.joinChannel(token, channelId, 0, {});

        } catch (e) {
            console.error('Agora Join Error:', e);
        }
    }

    async leaveChannel() {
        if (!this._engine) return;
        try {
            // In v4, leaveChannel takes optional options
            await this._engine.leaveChannel();
            this._isInChannel = false;
        } catch (e) {
            console.error('Agora Leave Error:', e);
        }
    }

    async setRole(role) {
        if (!this._engine) return;
        const clientRole = (role === 'host' || role === 'speaker')
            ? ClientRoleType.ClientRoleBroadcaster
            : ClientRoleType.ClientRoleAudience;

        await this._engine.setClientRole(clientRole);

        if (clientRole === ClientRoleType.ClientRoleBroadcaster) {
            await this._engine.enableLocalAudio(true);
        } else {
            await this._engine.enableLocalAudio(false);
        }
    }

    async toggleMute(isMuted) {
        if (!this._engine) return;
        // muteLocalAudioStream(mute)
        await this._engine.muteLocalAudioStream(isMuted);
    }

    async destroy() {
        if (this._engine) {
            // In v4 we usually release() 
            this._engine.release();
            this._engine = null;
        }
    }
}

export default new AgoraService();
