import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { fetchCollection, fetchCollectionStatus, fetchCollectionXrefIndex, triggerCollectionReload } from 'src/actions';
import { selectCollection, selectCollectionStatus, selectCollectionXrefIndex } from 'src/selectors';


class CollectionContextLoader extends PureComponent {
  constructor(props) {
    super(props);
    this.fetchStatus = this.fetchStatus.bind(this);
  }

  componentDidMount() {
    this.fetchStatus();
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    const { collectionId, status } = this.props;
    const prevStatus = prevProps.status;
    this.fetchIfNeeded();

    const wasUpdating = prevStatus.pending > 0 || prevStatus.running > 0;
    const isUpdating = status.pending > 0 || status.running > 0;

    if (wasUpdating && !isUpdating) {
      this.props.triggerCollectionReload(collectionId);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  fetchIfNeeded() {
    const { collectionId, collection } = this.props;

    if (collection.shouldLoad) {
      this.props.fetchCollection({ id: collectionId });
    }

    const { xrefIndex } = this.props;
    if (xrefIndex.shouldLoad) {
      this.props.fetchCollectionXrefIndex({ id: collectionId });
    }
  }

  fetchStatus() {
    const { collectionId } = this.props;
    this.props.fetchCollectionStatus({ id: collectionId })
      .finally(() => {
        const { status } = this.props;
        const duration = status.pending === 0 ? 6000 : 2000;
        clearTimeout(this.timeout);
        this.timeout = setTimeout(this.fetchStatus, duration);
      });
  }

  render() {
    return this.props.children;
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps;
  return {
    collection: selectCollection(state, collectionId),
    status: selectCollectionStatus(state, collectionId),
    xrefIndex: selectCollectionXrefIndex(state, collectionId),
  };
};
const mapDispatchToProps = {
  fetchCollection,
  fetchCollectionStatus,
  fetchCollectionXrefIndex,
  triggerCollectionReload,
};
export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(CollectionContextLoader);
